---
title: "AtomOne v4: Technical Reference"
description: AtomOne v4 upgrades core infrastructure, introduces Governors as a new class of governance participants, and adds constitutional economic controls
publishDate: 2026-04-22T12:00:00-01:00
cover: cover.png
summary: AtomOne v4 is built on three distinct pillars, a full upgrade to Cosmos SDK v0.50 and IBC-go v10, the introduction of Governors as a governance-specific delegation mechanism decoupled from staking, and a set of economic controls aligned with the AtomOne Constitution including network-enforced validator commission and the Nakamoto Bonus reward mechanism.
is_header_clear: true
---

## Scope

AtomOne v4 is built on three distinct pillars. The first is infrastructure: a full upgrade to Cosmos SDK v0.50 and IBC-go v10, which required substantial restructuring of the application layer and enabled the SDK fork to serve as the canonical home for all AtomOne governance logic, and may serve as reference SDK for other projects in the future as it develops and diverges from the Cosmos SDK. The second is a new class of governance participants — Governors — that introduce a governance-specific delegation mechanism, fully decoupled from staking. The third is a set of economic controls aligned with the AtomOne Constitution: network-enforced validator commission and the Nakamoto Bonus reward mechanism, aimed at improving stake decentralization. Alongside these, the `x/coredaos` module translates the constitutional Oversight and Steering DAOs from design documents into enforceable on-chain protocol capabilities.

This document is addressed to developers, protocol engineers, and technically sophisticated reviewers. It assumes familiarity with the Cosmos SDK, Tendermint/CometBFT consensus, and standard blockchain governance concepts. The focus is on what changed in v4, why each design choice was made, and where the implementation has known limitations or deferred work.

Features introduced in v3 — dynamic deposit throttling, dynamic quorum, late-quorum voting period extension, PHOTON, and `x/dynamicfee` — are carried forward into v4 and are not re-explained here, though they figure in the migration discussion where relevant.

## 1. Infrastructure: Cosmos SDK v0.50 and IBC-go v10

### 1.1 What the upgrade entails

The jump from SDK v0.47 (used in v3) to v0.50 is primarily an internal restructuring. The three changes most relevant to AtomOne are:

**The `cosmossdk.io/collections` framework.** SDK v0.50 introduces a typed key-value abstraction that replaces the previous pattern of raw `store.Get`/`store.Set` calls with codec lookups. All state in the modified modules — `x/gov`, `x/staking`, `x/distribution` — is now managed through `collections.Map`, `collections.Item`, and `collections.KeySet` types. The framework provides compile-time type safety, eliminates repetitive marshal/unmarshal code, and enables features like prefix-range iteration over composite keys. The Governors feature was designed and partially implemented before the v0.50 migration but was adapted to v0.50 and refactored to make use of `collections`; the move to `collections` provided a cleaner expression for its composite-key indices — the `ValidatorSharesByGovernor` index is a `collections.Map` keyed on `Pair[GovernorAddress, ValAddress]`, which the old store primitives could have expressed but with considerably more cumbersome marshal/unmarshal scaffolding.

**CometBFT v0.38 and the `FinalizeBlock` ABCI interface.** CometBFT 0.38 consolidates `BeginBlock`, `DeliverTx`, and `EndBlock` into a single `FinalizeBlock` call. For AtomOne specifically, this required re-ordering the EndBlocker chain so that `gov.EndBlock` executes before `staking.EndBlock`, a requirement imposed by the ICS consumer chain relationship (commit `53b7dec7`). The ante handler chain was also reordered: signature verification now precedes stateful checks, and fee deduction happens earlier in the pipeline (commit `5252d831`). The upgrade also brings a series of security-relevant consensus fixes — including a targeted patch for CSA-2026-001 ("Tachyon"), applied via the CometBFT v0.38.21 bump in commit `59d35b8a`.

**IBC-go v10 and capability removal.** The legacy `x/capability` module — a cross-module resource manager that IBC used for port and channel ownership — is eliminated in IBC-go v10, which internalizes its own capability tracking. The v4 store upgrade reflects this directly: `capability` is a deleted store and `ibc_interchain_accounts_controller` is added for the updated ICA controller configuration.

### 1.2 The AtomOne SDK

AtomOne runs against a custom fork of the Cosmos SDK at `github.com/atomone-hub/cosmos-sdk`, initially tracking `release/v0.50.x` of the Cosmos SDK. All AtomOne-specific logic — Governors, Nakamoto Bonus, commission bounds, `x/dynamicfee` — lives in this fork. The fork carries targeted patches on top of Cosmos SDK, enabling the AtomOne binary to benefit from its security fixes without coupling feature delivery to Cosmos SDK release schedules. We will refer to this fork as *AtomOne SDK* moving forward, with the objective of progressively diverging from the Cosmos SDK and transitioning to full independent development.

The fork is the single authoritative implementation. The AtomOne repository's `x/gov` module serves as a backward-compatibility wrapper around the fork's implementation, as described in Section 3.

**Versioning and long-term trajectory.** With v4, the Atomone SDK will be versioned as `v0.500.0`. The version number is chosen deliberately: it is high enough that it cannot be confused with any release in the Cosmos SDK `v0.5x.x` series (which patches well below three digits), yet retains a semantic echo of its origin as a v0.50 descendant. This signals clearly that the two projects share a common ancestor but are now on independent release trajectories.

The development intention beyond AtomOne v4 and AtomOne SDK v0.500.0 is progressive divergence. New features — constitutional governance mechanisms, the Governors system, the Nakamoto Bonus adjustment logic, and future additions that do not have Cosmos SDK analogues — will be developed natively in the AtomOne SDK without regard to Cosmos SDK alignment. The AtomOne SDK aims to become a credible alternative to the Cosmos SDK for chains where governance integrity and stake decentralization are first-class design constraints, with even more to come in the future. The Cosmos SDK is the dominant infrastructure layer in the IBC ecosystem today; the AtomOne SDK positions itself as a leaner, constitutionally-grounded alternative.

The AtomOne SDK will nonetheless continue to be monitored for Cosmos SDK security patches and correctness fixes. Applicable vulnerability fixes from the Cosmos SDK will be evaluated and backported as needed. Symmetrically, security discoveries made in the AtomOne SDK — whether by the core team, external auditors, or the bug bounty program — will be contributed upstream where appropriate, benefiting the broader ecosystem regardless of which codebase finds them first.

## 2. Governors

### 2.1 The problem being solved

The AtomOne Constitution ([Article 3, Section 9](https://github.com/atomone-hub/genesis/blob/main/CONSTITUTION.md#section-9-validators)) establishes that validator staking delegations do not confer governance voting power: validators vote only with their self-stake. This is enforced in the governance tally since v1. The consequence is that any ATONE holder who does not cast a direct vote on a proposal is simply unrepresented — their tokens contribute nothing to governance outcomes.

This is a coherent design for a network with a small, highly engaged participant base. At scale, it creates friction: governance participation requires tracking every proposal and voting on each one, which is unreasonable to expect of every delegator. The canonical Cosmos SDK solution is to inherit votes from validators, but that re-introduces the role conflation the Constitution explicitly prohibits.

Governors are the proposed middle layer. They are individuals that governance participants trust to vote on their behalf, registered on-chain as first-class entities, and operating through a delegation mechanism entirely separate from staking. A delegator can stake to validator A for consensus security, while delegating governance power to Governor B — the two relationships are orthogonal and independently managed.

The Constitution defines a Governor formally as "a type of account that can have tokens' governance voting power delegated to them." The intended population is not (only) validators: governance leadership is expected to emerge from researchers, analysts, community contributors, and other participants whose judgment governance delegators find credible — individuals who invest time and expertise in evaluating proposals rather than in operating consensus infrastructure. The full design rationale and philosophy are documented in [ADR-006: Governors](https://github.com/atomone-hub/atomone/blob/main/docs/architecture/adr-006-governors.md).

### 2.2 State model

The Governor implementation adds four new collections to the governance store:

```
Governors:                         GovernorAddress → Governor
GovernanceDelegations:             AccAddress → GovernanceDelegation
GovernanceDelegationsByGovernor:   Pair[GovernorAddress, AccAddress] → GovernanceDelegation
ValidatorSharesByGovernor:         Pair[GovernorAddress, ValAddress] → GovernorValShares
```

The first three are conceptually straightforward. The fourth — `ValidatorSharesByGovernor` — is the structural core of the design and deserves careful attention.

`GovernorValShares` records how many staking delegation *shares* a governor's delegators collectively hold against a specific validator. Concretely: if delegator Alice holds 1,000 shares with validator V1 and has delegated governance power to Governor G, then `ValidatorSharesByGovernor[(G, V1)]` contains (at least) 1,000 shares attributed to G. This index is maintained **incrementally** — it is never recomputed from scratch — through staking hooks.

When Alice delegates governance power to G, the module iterates Alice's staking delegations and calls `IncreaseGovernorShares(G, V1, alice_shares_V1)` for each validator she delegates to. When she undelegates from G, the symmetric `DecreaseGovernorShares` is called. When she bonds more to V1 or starts unbonding, the `BeforeDelegationSharesModified` hook removes her old share count and `AfterDelegationModified` re-adds the new one. The invariant is: at any point in time, `ValidatorSharesByGovernor[(G, V)]` equals the sum of staking shares held by all of G's governance delegators with validator V.

The purpose of this incremental index is tally performance. At tally time, computing G's total voting power is a direct summation over its `ValidatorSharesByGovernor` entries — O(validators) — rather than a full scan of all delegations of all G's governance delegators, which could be O(delegators × validators per delegator).

### 2.3 Lifecycle and constraints

**Creating a governor.** Any account can create a governor record via `MsgCreateGovernor`, specifying a description (moniker, identity, website, security contact, details) in a similar fashion to validators. A governor starts in INACTIVE status. To become ACTIVE, the account must meet two conditions: have a governance self-delegation (i.e., delegate governance power to itself) and have at least `MinGovernorSelfDelegation` (default: 10,000 ATONE) bonded across its staking delegations.

The minimum self-delegation requirement is a spam-deterrent and engagement gauge. It prevents accounts with negligible stake from becoming governors that accumulate voting power without meaningful skin in the game.

**Status transitions.** A governor can toggle between ACTIVE and INACTIVE, subject to a cooldown (`GovernorStatusChangePeriod`, 28 days). The cooldown prevents rapid on-off cycling. When a governor goes inactive, it can itself delegate governance power to another governor — inactive governors are not required to vote with their own power.

**Automatic deactivation.** If an active governor's bonded stake falls below `MinGovernorSelfDelegation` due to unbonding, the `AfterDelegationModified` staking hook automatically sets the governor's status to INACTIVE. The hook also updates `LastStatusChangeTime`, which means the governor must wait out the cooldown period before reactivating even though they were deactivated involuntarily. This is a deliberate design choice: it removes the governor from tally influence until they restore their stake and manually re-activate, preventing them from exercising delegated voting power without meeting the proper requirements.

**Governance delegation.** A delegator associates their entire governance voting power with exactly one governor via `MsgDelegateGovernor`. Partial delegation is not supported — the design explicitly avoids the complexity of weighted governance delegation. Switching governors is a direct redelegate (atomically undelegates and re-delegates) that can be done freely and without cooldowns or wait periods, as governance delegation is completely disentangled from staking. Reverting to direct-voting-only is done with `MsgUndelegateGovernor`. A delegator with a governance delegation can still vote directly on any proposal; the delegation applies only when the delegator does not cast a direct vote, mirroring the original model where validators inherited uncast delegator power.

An active governor is forced to self-delegate. If Alice is an active governor, she cannot delegate her governance power to anyone else; she participates directly. An inactive governor has no such restriction.

**State cleanup.** When an inactive governor has zero governance delegations (all delegators have moved away or undelegated), the governor record is pruned from state entirely. Active governors cannot be pruned.

### 2.4 Tally mechanics

The tally function follows a two-phase process that is in practice similar to the process where validators inherit governance voting power from their staking delegations. All individual votes are processed first; then active governor votes are applied with the accumulated deductions.

**Phase 1: Individual votes.** For each direct vote, the voter's staking delegations are iterated to compute their voting power. If the voter has a governance delegation to governor G, their staking shares are accumulated into a per-G deductions map:

```
G.ValSharesDeductions[validator] += voter.shares_with_validator
```

This deduction will be subtracted from G's aggregated shares before G's vote is applied, preventing double-counting.

**Phase 2: Active governor votes.** For each governor who both voted and passes the eligibility check (active status, meets minimum self-delegation), the module computes:

```
G_voting_power = Σ(validators V) [
    (ValidatorSharesByGovernor[(G,V)] - G.ValSharesDeductions[V]) × V.BondedTokens / V.DelegatorShares
]
```

The subtraction removes the power of delegators who voted directly, so each token is counted exactly once.

A governor who voted but whose governance delegators all voted directly will aggregate zero net Phase 2 governor power — the governor's contribution from Phase 2 adds nothing beyond the voting power they already contributed as a direct voter in Phase 1, which reflects their own minimum self-delegated stake. A governor who did not vote contributes nothing regardless of delegated power. This second condition is important: an absent governor does not suppress their delegators' uncast votes; those simply go unrepresented, the same as if no governor existed.

**Filtering:** The `getCurrGovernors` function runs the following checks before including a governor in phase 2: status == ACTIVE, bonded tokens >= `MinGovernorSelfDelegation`, and the governor has cast a vote on this proposal. Governors that do not vote are excluded completely.

### 2.5 Performance

**Theoretical complexity.** Without governors, tally cost scales as O(V × D) where V is the number of votes and D is the average staking delegation count per voter — each vote iterates the voter's delegations to compute weighted power. Adding governors does not change this dominant term. Phase 1 adds a constant-time `GovernanceDelegations` lookup per voter and a per-delegation deduction update to an in-memory map: still O(V × D). Phase 2 iterates active governors who voted, computing net power for each by ranging over their `ValidatorSharesByGovernor[(G,·)]` entries and subtracting deductions — both bounded by the number of validators N_val. The total Phase 2 cost is O(G_active × N_val).

The composite tally cost with governors is therefore O(V × D + G_active × N_val). In a realistic scenario — V=200,000, D≈3 delegations per voter, G_active=1,000, N_val=100 — Phase 1 dominates at ≈600,000 operations, with Phase 2 adding ≈100,000. The key property is that adding governors costs O(G_active × N_val), not O(G_active × delegators_per_governor). Without the `ValidatorSharesByGovernor` incremental index, Phase 2 would require iterating all governance delegators of each governor to reconstruct their aggregate power — O(G × L × N_val) where L is delegators per governor — several orders of magnitude worse at scale.

Introducing governance delegation adds overhead to the tally because the vote processing loop now maintains the deductions map and cross-references the `GovernanceDelegations` collection for every voter. To quantify this overhead against the theoretical prediction, the team ran a synthetic benchmark on a bloated genesis with realistic delegation distributions.

**Dataset 1: 100 validators, 200,000 delegators, 20 governors, 100,000 governance delegations**

| Vote count | With governors | Without governors | Validators-inherit (legacy x/gov) |
|---|---|---|---|
| 200,000 | ~3.9s | ~4.3s | ~4.7s |
| 160,000 | ~3.0s | ~3.5s | ~3.8s |
| 120,000 | ~2.3s | ~2.7s | ~2.9s |
| 80,000 | ~1.5s | ~1.8s | ~1.9s |
| 40,000 | ~0.8s | ~0.9s | ~1.0s |

**Dataset 2: 100 validators, 200,000 delegators, 1,000 governors, 100,000 governance delegations**

| Vote count | With governors | Without governors | Validators-inherit (legacy x/gov) |
|---|---|---|---|
| 200,000 | ~4.0s | ~4.3s | ~4.7s |
| 160,000 | ~3.1s | ~3.5s | ~3.8s |
| 80,000 | ~1.6s | ~1.8s | ~1.9s |

These numbers are counterintuitive: the governors path is *faster* than the governors-absent path and significantly faster than validator inheritance. The explanation lies in a targeted optimization applied during benchmarking: the `delegation.GetValidatorAddr()` call inside the tally loop — which converts a validator operator address between string representations on every iteration — was identified as a significant CPU hotspot (approximately 27% of tally time). Removing this unnecessary conversion yields roughly a 1.2s gain on 200k votes. This optimization was applied equally to all three tally variants shown above.

The scaling behavior is important: tally time is approximately linear in vote count with comparable constant factors whether governors are present or not. The `ValidatorSharesByGovernor` incremental index is the reason: at tally time the governor's power is computed in O(validators), not O(delegators), so adding 1,000 governors to the scenario adds O(governors × validators) = O(100,000) lookups, which is dominated by the O(votes × delegations-per-voter) loop.

The benchmark was generated using the [`govbox bench-tally`](https://github.com/atomone-hub/govbox) tool, which produces a bloated genesis with configurable validator, delegator, and governor counts and runs a single-node network for repeated `Tally` queries.

### 2.6 Design notes

**Single delegation per account.** A governance delegation is all-or-nothing: a delegator assigns their entire governance influence to exactly one governor. This is an intentional simplification — analogous to political representation, where a citizen casts a single vote rather than apportioning it across candidates. It avoids the complexity of weighted power splits and keeps the delegation relationship semantically clean. An account that prefers direct voting on specific proposals can always vote directly, even with an existing governance delegation. Moreover, re-delegating governance voting power is doable without delays or cooldown periods.

**Governor discoverability.** The protocol does not prescribe how governors communicate their positions, publish their voting track record, or establish reputation. These functions are left to offchain tooling: governance dashboards, block explorers, and social coordination. The minimal onchain footprint keeps the module focused and avoids premature standardization of offchain conventions that are still evolving.

## 3. Governance Module Migration: `atomone.gov.v1` → `cosmos.gov.v1`

### 3.1 The architectural situation

Before v4, the AtomOne `x/gov` module at `github.com/atomone-hub/atomone/x/gov` was a standalone governance implementation under the `atomone.gov.v1` Protobuf namespace. It contained all of AtomOne's governance innovations — dynamic quorum, deposit throttling, late-quorum extension, validator vote suppression, and law and constitution amendment proposals. The AtomOne SDK `x/gov` carries the same feature set under the `cosmos.gov.v1` namespace and is now the authoritative implementation.

The migration goal is to move all governance state and query endpoints to the AtomOne SDK implementation while maintaining backward compatibility with clients and indexers that were built against `atomone.gov.v1`. A drastic cutover — removing the old module immediately — would break every existing frontend and indexer at the moment of the upgrade. The chosen approach defers breakage to v5 by introducing a wrapper layer that serves `atomone.gov.v1` responses backed by `cosmos.gov.v1` state.

### 3.2 The wrapper architecture

The AtomOne `x/gov` module in v4 is not an implementation — it is a translation layer. The `AppModule` registers under `atomone-gov`, maintains the `atomone.gov.v1` gRPC service registrations, but delegates all state operations to the AtomOne SDK gov keeper through an embedded pointer:

```go
type Keeper struct {
    *govkeeper.Keeper  // AtomOne SDK keeper — owns all state
}
```

Every query goes through a conversion cycle:
1. Receive request as `atomone.gov.v1` type
2. Forward to the embedded AtomOne SDK keeper
3. Receive response as `cosmos.gov.v1` type
4. Convert to `atomone.gov.v1` type and return

The `wrapper.go` file (695 lines) implements the full set of bidirectional conversion functions for every governance type: proposals, votes, deposits, params, tally results, and all the new governor types. The conversions are structural and mechanical — field-by-field assignments with enum casts, no business logic.

**What clients do and don't see:** A client querying `atomone.gov.v1.Query/Proposal` will receive a correctly-shaped response. A client trying to query `atomone.gov.v1.Query/Governor` will also receive a correctly-shaped response, since governor types are included in the wrapper. What is *not* available through the `atomone.gov.v1` namespace is direct access to any query that was added to `cosmos.gov.v1` and has no `atomone.gov.v1` analogue — but for all pre-existing queries, backward compatibility is maintained.

### 3.3 The store migration at upgrade height

The upgrade handler migrates all governance store entries from `atomone.gov.v1` Protobuf encoding to `cosmos.gov.v1` Protobuf encoding using the `collcodec.NewAltValueCodec` pattern. This codec first attempts to decode a stored value as the new `cosmos.gov.v1` type; if that fails, it falls back to the old `atomone.gov.v1` type and applies a conversion function. This allows the migration to re-encode every record in a single pass without needing to enumerate all keys twice.

The migration covers:

| Collection | Key |
|---|---|
| Params | New fields initialized: `MinDepositRatio`, `GovernorStatusChangePeriod`, `MinGovernorSelfDelegation = 10,000 ATONE` |
| Deposits | Field-for-field re-encoding |
| Votes | Field-for-field re-encoding |
| Proposals | Includes new `Endorsed`, `Annotation`, `TimesVotingPeriodExtended` fields |
| LastMinDeposit / LastMinInitialDeposit | Dynamic throttler state |
| QuorumCheckQueue | Late-quorum extension queue entries |
| Governors | New collection; initialized empty |
| GovernanceDelegations | New collection |
| GovernanceDelegationsByGovernor | Reverse index |
| ValidatorSharesByGovernor | Per-(governor, validator) share tracking |

Params migration also applies default values for the new `MinDepositRatio` field and initializes the `GovernorStatusChangePeriod` with the SDK default.

### 3.4 The ante handler dual-message problem

A security issue was discovered and fixed during v4 development (commit `04bb9492`): the governance vote ante handler — which enforces that a voter has a minimum stake before voting — was checking only for `atomone.gov.v1.MsgVote` and `atomone.gov.v1.MsgVoteWeighted`. Because the SDK module is also wired in v4, transactions could submit `cosmos.gov.v1.MsgVote` and bypass the stake check entirely.

The fix extends the type switch in `ante/gov_vote_ante.go` to cover all eight relevant message types:

```go
case *govv1beta1.MsgVote:           // atomone legacy
case *govv1.MsgVote:                // atomone v1
case *sdkgovv1beta1.MsgVote:        // cosmos legacy — added
case *sdkgovv1.MsgVote:             // cosmos v1 — added
// ... and the four weighted variants
```

The handler also uses recursive authz unwrapping to catch nested `MsgExec` payloads, preventing the stake check from being bypassed through an authorization grant.

### 3.5 The v5 path

The wrapper is a transient compatibility shim, not a permanent architecture. Its removal in v5 requires: (a) removing the `atomone-gov` AppModule registration, (b) deleting `wrapper.go` and the wrapper keeper, (c) updating all clients and indexers to use `cosmos.gov.v1` endpoints directly, and (d) removing the extra SDK message type cases from the vote ante handler, since there will be a single type system. The underlying state is unaffected — the same SDK keeper owns all governance state in both v4 and v5; the wrapper adds no state of its own.

The conversion functions in `wrapper.go` are written against the current schemas of both type systems. When either evolves, the conversions must be updated accordingly — an obligation that disappears entirely at v5 removal.

## 4. `x/coredaos`

### 4.1 Constitutional basis

The AtomOne Constitution ([Article 2, Section 4.b](https://github.com/atomone-hub/genesis/blob/main/CONSTITUTION.md#section-4b-core-daos-with-special-powers)) defines two Core DAOs with special protocol-level powers: the Steering DAO, which provides guidance, endorsements, and timeline adjustments, and the Oversight DAO, which can veto proposals that violate the Constitution and extend proposal timelines to ensure review. These powers are not advisory suggestions — they are meant to be enforced by the protocol.

The `x/coredaos` module instantiates precisely those capabilities and nothing more. It does not manage DAO treasury funds, membership, or internal governance because they are meant to be handled separately - and possibly using [gno.land](https://gno.land/). It provides the on-chain hooks through which the DAO addresses, once configured, can exercise their constitutional functions. Both DAO addresses are empty by default, meaning all functions are disabled until explicitly set through a governance proposal.

Both DAOs are possibly expected to be, at least initially, multisig accounts operated by the respective DAO's participants. The longer-term vision is for each DAO to operate as an Interchain Account controlled by a governance DAO running on [gno.land](https://gno.land/) — establishing cross-chain accountability and embedding the DAOs into the shared security model described in Section 7. The Constitution requires that all Core DAO participants are Citizens with public and known real human identities ([Article 2, Section 4.b](https://github.com/atomone-hub/genesis/blob/main/CONSTITUTION.md#section-4b-core-daos-with-special-powers)), ensuring that the exercise of veto and endorsement powers is traceable to identified individuals.

### 4.2 Module parameters and constraints

```go
type Params struct {
    SteeringDaoAddress            string        // empty = all steering functions disabled
    OversightDaoAddress           string        // empty = all oversight functions disabled
    VotingPeriodExtensionsLimit   uint32        // max extensions any proposal can receive
    VotingPeriodExtensionDuration time.Duration // per-extension duration (default 7 days)
}
```

The validation rules on `MsgUpdateParams` encode several constitutional constraints:

- The Oversight and Steering DAO addresses cannot be equal — to prevent a single entity from holding both roles simultaneously.
- Neither address can equal the module authority (the governance account) — to prevent governance itself from acting as a DAO.
- Neither DAO can have bonded or unbonding stake — enforcing the Constitution's prohibition on Core DAOs staking ATONE. This check queries the staking keeper at update time. For DAO addresses implemented as Interchain Accounts controlled from [gno.land](https://gno.land/), ICA accounts on AtomOne cannot stake, so this constraint is structurally guaranteed rather than merely point-in-time.

### 4.3 Steering DAO capabilities

**`MsgAnnotateProposal`:** Adds a free-text annotation to a proposal in the voting period. Annotations are stored on the `Proposal` object and visible in query responses. The Steering DAO may overwrite an existing annotation by setting `overwrite: true`. Annotation length is capped at 5,000 characters. The Steering DAO cannot annotate proposals that are not in the voting period.

**`MsgEndorseProposal`:** Marks a proposal as endorsed, setting a boolean flag on the `Proposal` object. Endorsement is one-way — it cannot be revoked. Per the Constitution, a Steering DAO endorsement reduces the passing threshold for law proposals from Constitutional Majority (>90%) to Supermajority (>2/3). The mechanics of this threshold reduction are implemented in the SDK fork's tally logic, which reads the `Endorsed` field.

**`MsgExtendVotingPeriod`:** Extends a proposal's `VotingEndTime` by `VotingPeriodExtensionDuration`. The module removes the proposal from the `ActiveProposalsQueue` at its current end time and reinserts it at the new end time, preventing premature processing. `TimesVotingPeriodExtended` is incremented, and the module enforces that this counter does not exceed `VotingPeriodExtensionsLimit` (default 3, yielding a maximum of 21 additional days with the 7-day default extension duration). Both the Steering DAO and the Oversight DAO can exercise this power.

### 4.4 Oversight DAO: veto and its constraints

**`MsgVetoProposal`:** Immediately rejects a proposal in the voting period. The effect is:

1. Deposits are either burned (`burn_deposit: true`) or refunded to depositors.
2. `proposal.Status` is set to `StatusVetoed`.
3. The final tally result is zeroed out.
4. `VotingEndTime` is set to the current block time.
5. All existing votes are deleted.
6. The proposal is removed from the `ActiveProposalsQueue`.
7. The dynamic deposit throttler is updated (as if an active proposal ended), adjusting the current minimum deposit.

The veto power is significant. A single address can nullify any proposal, regardless of how much community support it has gathered. The Constitutional constraint is that the Oversight DAO may only veto proposals that violate the Governing Documents. The protocol cannot enforce *why* a veto was cast — that is a social and legal constraint — but it can prevent the most obvious structural abuse.

**Anti-self-veto protection.** The module checks every message in the vetoed proposal for `MsgUpdateParams` messages that change the `OversightDaoAddress`. If any such message is found, the veto is rejected:

```go
if updateParamsMsg.Params.OversightDaoAddress != params.OversightDaoAddress {
    return nil, types.ErrInvalidVeto.Wrapf(
        "proposal with ID %d contains a change of the oversight DAO address",
        proposal.Id,
    )
}
```

This comparison was intentionally changed in commit `464a0030` to block *any* change to the oversight address — including a proposal that would *disable* the Oversight DAO by setting its address to empty. The earlier version only blocked changes to a non-empty address, which left open the scenario where a captured Oversight DAO could veto its own disablement.

**Anti-bundling protection.** A separate check runs in the ante handler (`ante/gov_submit_proposal_ante.go`, added in commit `e6663a55`). When a proposal containing more than one message is submitted, the handler checks whether any of the messages — including those nested inside `authz.MsgExec` — is an `MsgUpdateParams` that changes the Oversight DAO address. If so, the proposal is rejected at submission time with `ErrUnauthorized`. This prevents the technique of burying a consequential DAO address change inside an otherwise unrelated proposal. Single-message proposals that only change the oversight address are permitted — this is the expected governance mechanism.

The recursive `authz` unwrapping (`FlattenAnyMsgs`) handles arbitrary nesting depth, so the check cannot be bypassed by wrapping the sensitive message inside multiple layers of `MsgExec`.

### 4.5 Design critique

The module achieves its stated goal — translating the constitutional DAO roles into protocol-level capabilities — cleanly and with appropriate constraints. A few observations on the design choices:

The disable-by-default stance (empty address = disabled) means the module is safely deployable before any DAO address is established. However, there is no mechanism to prevent the governance account from setting the Oversight DAO address to an address that it controls. The separation of powers depends on governance participants reviewing and voting correctly on the address assignment.

The stake-check in `UpdateParams` verifies that the DAO address has no bonded stake at the moment of the update. It cannot prevent the DAO from staking *after* the address is set. Ongoing constitutional compliance is a social expectation, not a protocol enforcement.

The `VetoProposal` handler updates the dynamic deposit throttler state after a veto, calling `UpdateMinInitialDeposit` and `UpdateMinDeposit` with `checkElapsedTime=true`. This is correct and intentional: the throttler's minimum deposit formula depends on the number of active proposals, so any state change that removes a proposal from the active set — whether natural rejection, passage, or veto — must trigger a recalculation. A veto is economically equivalent to a natural proposal rejection from the throttler's perspective.

## 5. Fixed Validator Commission and Nakamoto Bonus

### 5.1 The economic rationale

Standard proportional staking rewards produce a reward rate per unit of stake (RPS) that is identical regardless of which validator a delegator chooses:

$$RPS = \frac{R_i}{S_i}$$

where $R_i$ is the block reward and $S_i$ is total bonded stake. This indifference means delegators have no financial incentive to prefer smaller validators over larger ones, which tends toward stake concentration. At the time of writing, AtomOne's Nakamoto Coefficient — the minimum number of validators required to exceed one-third of total voting power and halt consensus — is 5, well below the theoretical ideal of 34 for a 100-validator set.

Separately, the Constitution ([Article 3, Section 9](https://github.com/atomone-hub/genesis/blob/main/CONSTITUTION.md#section-9-validators)) mandates that validator commission be a global, governance-controlled rate rather than independently set by operators. Unrestricted commission competition creates structural problems: validators race to zero commission to attract delegations, undermining long-term sustainability. The ability to lower and then raise commission also creates an extraction dynamic where validators attract delegations at a low rate and then increase it. The Nakamoto Bonus design rationale and parameterization are documented in [ADR-004: Nakamoto Bonus](https://github.com/atomone-hub/atomone/blob/main/docs/architecture/adr-004-nakamoto-bonus.md).

### 5.2 Fixed commission implementation

The AtomOne SDK adds two parameters to the staking module: `MinCommissionRate` and `MaxCommissionRate`. Both `MsgCreateValidator` and `MsgEditValidator` check that the proposed commission rate lies within `[MinCommissionRate, MaxCommissionRate]` and reject the message otherwise. When governance updates these bounds, the `UpdateValidatorCommissionsForNewRange` function iterates every existing validator and clamps their rate to the new range. If a validator's `MaxRate` (their self-declared upper bound) is below the new minimum, `MaxRate` is also lifted to avoid an inconsistent state.

The v4 upgrade handler sets both bounds to exactly 5%:

```go
fivePercent := math.LegacyMustNewDecFromStr("0.05")
params.MaxCommissionRate = fivePercent
params.MinCommissionRate = fivePercent
```

It then iterates every existing validator and applies the same rate. Validators whose declared `MaxRate` was below 5% also have their `MaxRate` raised. With `MinCommissionRate == MaxCommissionRate == 5%`, the only valid commission is 5%; any attempt to create or edit a validator with a different rate is rejected at the message server level.

The rate is a governance parameter. If the community decides to adjust it in the future, a standard `MsgUpdateParams` proposal targeting the staking module will call `UpdateValidatorCommissionsForNewRange` automatically.

### 5.3 Nakamoto Bonus: mechanism

The Nakamoto Bonus replaces the uniform-RPS model with a two-component reward structure:

$$R_i = PR_i + NB_i$$

The proportional reward $PR_i = R_i \times (1 - \eta)$ is distributed in proportion to each validator's stake as before. The Nakamoto Bonus $NB_i = R_i \times \eta$ is distributed equally across all bonded validators, regardless of stake. The validator reward becomes:

$$r_{ji} = \frac{x_{ji}}{S_i} \times PR_i + \frac{NB_i}{N_i}$$

The resulting reward-per-stake for validator $j$:

$$RPS_{ji} = \frac{PR_i}{S_i} + \frac{NB_i}{N_i \times x_{ji}}$$

The second term is inversely proportional to $x_{ji}$. Validators with smaller stake receive a higher RPS, giving delegators a concrete financial reason to prefer them. The total block reward is unchanged — only the distribution changes.

The initial value of $\eta$ is 3%, meaning 3% of block rewards are redistributed through the equal-share mechanism. This is a conservative starting point: significant enough to create a measurable incentive differential at the current level of stake concentration, but small enough to preserve the fundamental proportionality of the reward model.

### 5.4 Dynamic adjustment of $\eta$

The $\eta$ coefficient is adjusted weekly (via the `x/epochs` module) by the `AdjustNakamotoBonusCoefficient` function. The algorithm:

1. Retrieve all bonded validators and sort by voting power descending.
2. Divide into three equal groups of floor(N/3) validators each: high (top), medium (middle), low (bottom).
3. Compute the average bonded stake for the high and low groups.
4. If `high_avg / low_avg ≥ 3` (or if `low_avg == 0`): increase $\eta$ by `Step` (default 1%).
5. Otherwise: decrease $\eta$ by `Step`.
6. Clamp to `[MinimumCoefficient, MaximumCoefficient]` (defaults: 3% and 100%).

The 3× threshold reflects the following intuition: if the average stake of the top third of validators is at least three times the average of the bottom third, the network's stake distribution is sufficiently concentrated that the bonus should strengthen. Below that ratio, distribution is improving and the bonus can recede.

The epoch-based triggering (via `x/epochs`) was a deliberate refactoring from the original fixed-block-interval implementation. Epochs decouple adjustment timing from block rate, making the behavior predictable from a calendar perspective and easier to reason about across chains with different block times. The distribution keeper implements `epochstypes.EpochHooks`, and `AfterEpochEnd` fires `AdjustNakamotoBonusCoefficient` whenever the epoch identifier matches `NakamotoBonus.PeriodEpochIdentifier`. The `x/epochs` module exists in the SDK fork and the distribution hooks are complete; the application-level wiring — registering the distribution keeper as an epoch hook consumer — is pending and will be completed before the v4 mainnet upgrade, analogously to the `x/dynamicfee` integration described in Section 6.

**Parameter rationale: bounds and rate of change.** The original ADR proposed adjustments of ±3% per 120,000 blocks (~one week). This was revised down to ±1% per real-time week. The concern with the faster rate is that delegators need time to observe the new reward distribution and reallocate stake in response. At ±3%, $\eta$ could triple from its initial value within two weeks of activation — well before delegation patterns have had any opportunity to respond. ±1% is slow enough that the delegation market can track the coefficient.

The `MinimumCoefficient` floor (set to 3%) addresses the opposite failure mode: if $\eta$ decreases to zero, the bonus disappears entirely and the incentive for delegators to prefer smaller validators is removed. The network could then stagnate at a concentrated configuration indefinitely — the update rule would observe "average top/bottom ratio < 3×" (because η=0 removed the mechanism that was improving concentration) and would never signal an increase. A positive floor ensures a baseline incentive persists even during periods when the network's distribution temporarily crosses the threshold. The `MaximumCoefficient` ceiling defaults to 100% and is adjustable by governance; its role in bounding Sybil exposure is discussed below.

### 5.5 Implementation details

**Reward split in `allocation.go`.** The Nakamoto Bonus extraction happens before per-validator distribution:

```go
if nb.Enabled {
    nakamotoBonus := validatorTotalReward.MulDecTruncate(nakamotoCoefficient)
    validatorTotalReward = validatorTotalReward.Sub(nakamotoBonus)
    
    if numValidators > 0 && !nakamotoBonus.IsZero() {
        for _, coin := range nakamotoBonus {
            amount := coin.Amount.QuoTruncate(math.LegacyNewDec(numValidators))
            nbPerValidator = nbPerValidator.Add(...)
        }
    }
}
```

The `QuoTruncate` (integer division rounding down) means small dust amounts from the equal split are discarded rather than accumulated and redistributed. This is a deliberate simplification — correct treatment would require tracking the remainder and adding it to the community pool or the next block's reward — but the discarded amounts are negligible for any reasonable validator count.

**Parameter defaults.** `NakamotoBonus` starts enabled, with $\eta_0 = 0.03$, step = 0.01, epoch = "week", minimum coefficient = 0.03, maximum coefficient = 1.0. These are initialized by the distribution module's v4 migration (`x/distribution/migrations/v4/`).

### 5.6 Design critique

**No hysteresis.** The coefficient adjusts by a fixed ±1% every week, with no dampening around the threshold. If the concentration ratio hovers near 3×, $\eta$ oscillates between adjacent values every week. In the future we might evaluate switching to a slightly different design that would include a hysteresis band (e.g., increase at 3×, decrease only below 2.5×) to prevent oscillation.

**Sybil attack surface and why it is bounded.** A validator that splits its self-stake across multiple registered instances receives the uniform Nakamoto Bonus component for each instance independently. In a fully static delegation environment, this is unambiguously profitable: the attacker collects $y$ bonus shares while contributing the same economic security they would as a single node.

A quantitative analysis using the actual AtomOne stake distribution shows, however, that this advantage disappears once delegation markets react. The optimal strategy for an outside delegator is to maximize reward-per-stake, which under the Nakamoto Bonus is inversely proportional to the validator's total bonded stake. A newly created Sybil node — by construction one of the smallest validators on the set — becomes the highest-yield target. Modelling a scenario where other delegators collectively shift just 0.1% of their stake toward the Sybil, the attacker's net gain crosses zero and turns negative before $\eta = 0.25$, and remains negative across the full range at higher redistribution. At $\eta = 1$, the static gain is +35% but the net gain with 0.1% delegation redistribution is approximately −3%.

The conclusion is that Sybil attacks are only transiently profitable during the window before other delegators respond. Once the market equilibrates — which the bonus mechanism itself incentivizes — the attacker is left operating a more expensive (two nodes) configuration for no reward advantage. No additional protocol mechanism is required to prevent Sybil attacks; the economic dynamics of the bonus are self-correcting.

The `MaximumCoefficient` cap remains relevant as a governance guardrail: the analysis above assumes that 0.1% of total stake is mobile enough to respond. At very high $\eta$ values, the static gain during the pre-equilibration window grows large enough that it could be worth a short-term extraction. Keeping $\eta$ bounded by a governance-adjustable ceiling limits this window's upside without disabling the mechanism.

**Integer group division.** The group size is computed as `N / 3` (integer division). For N=100, the high and low groups each contain 33 validators; the middle 34 are unused in the comparison. For validator counts that are not multiples of 3, the groups are slightly unequal but the logic is otherwise unchanged.

## 6. Dynamic Fee Market: Migration to SDK Fork

The `x/dynamicfee` module was introduced in v3. In v4, its canonical home moves from the AtomOne repository into the AtomOne SDK, where it is co-versioned with the other AtomOne-specific SDK modifications. This is purely a change of location and ownership, not of algorithm or interface: the module's behaviour is unchanged.

The migration carries one substantive fix absent from the repository version: a guard against `ConsensusParams.Block.MaxGas` returning 0 or -1, the CometBFT representation of "unlimited block gas." Without this guard, the fee price calculation attempts to divide by a zero or negative target, producing incorrect behaviour. The fork introduces a `DefaultMaxBlockGas` parameter (default: 100,000,000 gas units), and the `GetMaxBlockGas` helper returns this value whenever the consensus parameter is absent or unlimited.

## 7. IBC Light Client for Gno: `10-gno`

### 7.1 The interoperability gap

Standard IBC connectivity between Cosmos SDK chains relies on the `07-tendermint` light client, which knows how to verify Tendermint/CometBFT consensus headers. Gno — the smart contract platform developed by [gno.land](https://gno.land/) — runs Tendermint2 (TM2), a fork of the original Tendermint engine that predates the CometBFT rename and diverged before the two codebases converged on a common format. The differences are not cosmetic: header fields, block ID structures, commit representations, validator set encoding, address formats, and signature verification paths are all distinct enough that a CometBFT light client cannot meaningfully process a Tendermint2 block.

This incompatibility is the obstacle. Without a purpose-built client that understands TM2's wire format, AtomOne cannot open IBC channels to Gno chains, and by extension cannot participate in the shared security arrangements — including the Validation-as-a-Service model — that are on the longer-term roadmap.

### 7.2 Implementation approach

The `10-gno` module is an IBC light client implementation that speaks Tendermint2's dialect. Its structure is a direct derivative of `07-tendermint`, with modifications limited strictly to where the two consensus engines differ. This was a deliberate implementation choice: keeping the structure familiar reduces the audit surface and makes the differences explicit and reviewable by diffing against the upstream light client.

```sh
diff -bur modules/10-gno/ ibc-go/modules/light-clients/07-tendermint/
```

Client identifiers take the form `10-gno-{N}`, generated and validated by IBC core.

The module implements the full `exported.LightClientModule` and `exported.ClientState` interfaces from IBC-go v10:

- `Initialize` — unmarshals and validates initial client and consensus state
- `VerifyClientMessage` — routes to adjacent or non-adjacent header verification
- `CheckForMisbehaviour` — detects equivocation and timestamp violations
- `UpdateStateOnMisbehaviour` — freezes the client at the misbehaviour height
- `UpdateState` — advances the client state to the new trusted height
- `VerifyMembership` / `VerifyNonMembership` — Merkle proof validation against Gno's state store

### 7.3 The type conversion layer

The central engineering challenge is that TM2 types cannot be imported into a CometBFT-linked binary and used interchangeably. The `10-gno` module resolves this through a conversion layer: it imports `github.com/gnolang/gno/tm2/pkg/bft/types` directly, defines its own Protobuf representations of Gno consensus objects, and provides conversion functions between them.

The key conversions are:

**`ConvertToGnoValidatorSet`** — Converts a protobuf `ValidatorSet` to `bfttypes.ValidatorSet`. Enforces that every validator uses Ed25519 keys; any non-Ed25519 key causes the conversion to fail. Ed25519 is the only signature scheme Gno supports.

```go
if key.GetEd25519() == nil {
    return nil, errorsmod.Wrap(clienttypes.ErrInvalidHeader, "validator pubkey is not ed25519")
}
```

Addresses are parsed using `crypto.AddressFromString` from Gno's crypto package, which handles TM2's address encoding rather than CometBFT's.

**`ConvertToGnoCommit`** — Converts a protobuf `Commit` to `bfttypes.Commit`. The commit structure includes `BlockID` with `PartsHeader` (a Tendermint construct that CometBFT retained but whose exact encoding diverges). A notable edge case: Proto3 serializes absent validators in the `Precommits` field as zero-value `CommitSig` structs rather than null entries. The conversion detects absent validators by checking for an empty signature rather than a nil pointer:

```go
if sig == nil || len(sig.Signature) == 0 {
    continue
}
```

**`ConvertToGnoHeader`** — Converts a protobuf `GnoHeader` to `bfttypes.Header`. The TM2 header includes fields not present in CometBFT (`NumTxs`, `TotalTxs`, `AppVersion`) and omits or renames others. The conversion handles optional fields (`DataHash`, `LastResultsHash`) that may be empty without treating them as errors.

**`ConvertToGnoSignedHeader`** — Composes the above two into a `bfttypes.SignedHeader`.

Once the protobuf types are converted to their native Gno equivalents, verification proceeds using TM2's own verification code via `bfttypes.ValidatorSet.VerifyCommit` and the module's internal `VerifyLightCommit`. The latter tallies voting power from the trusted validator set to check whether the `trustLevel` fraction (default: 1/3) has signed the new header.

### 7.4 Verification logic

The module distinguishes two cases, consistent with the standard IBC light client model:

**Adjacent headers** (height Y = X + 1): Verification requires that the new header's `ValidatorsHash` matches the trusted header's `NextValidatorsHash`, and that more than 2/3 of the new validator set has signed the commit. This is a direct continuity check — if the validator set transition is valid, the new header is trusted.

**Non-adjacent headers** (height Y > X + 1): Verification requires that (a) the trusted header has not expired (`TrustingPeriod` has not elapsed since its timestamp), (b) at least `trustLevel` fraction of the *trusted* validator set has signed the new header, and (c) more than 2/3 of the *new* validator set has signed the new header. Both checks are required: the first establishes a chain of trust from the known state; the second establishes that the new validator set itself has BFT consensus.

The non-adjacent case check order is intentional: the 2/3 check on the new validator set is placed last precisely because an adversary could construct an arbitrarily large malicious validator set to force expensive computation. Placing the trusted-set check first rejects fabricated headers cheaply.

### 7.5 Misbehaviour detection

The misbehaviour type carries two conflicting headers for the same height. `ValidateBasic` on `Misbehaviour` checks that:

- Both headers are individually valid (including their respective validator set hashes).
- Both headers reference the same chain ID.
- The commits in both headers are verified against the provided validator sets using `VerifyCommit`.
- `Header1.Height >= Header2.Height` (ordering convention).

If `CheckForMisbehaviour` confirms the two headers are conflicting valid signatures for the same height, `UpdateStateOnMisbehaviour` freezes the client at `FrozenHeight = (0, 1)`, preventing any further state updates. A frozen client requires a governance proposal (`RecoverClient`) to unfreeze.

The `ConsensusState` stored after each successful update contains:
- `Timestamp` — block time from the TM2 header
- `Root` — Merkle root derived from `AppHash` via ICS-23 `MerkleRoot`
- `NextValidatorsHash` — used in subsequent adjacent-header verification
- `LcType = "gno"` — identifies the light client type in the stored state

### 7.6 Scope and context

The `10-gno` module is one component of a broader effort to establish full IBC v2 connectivity between AtomOne and Gno. The corresponding work on the Gno side — a Tendermint light client and IBC core logic implemented as Gno realms, along with a modular TypeScript relayer capable of operating across both chain types — is covered in detail in <PLACEHOLDER_LINK>.

On the AtomOne side, the module's inclusion in v4 means the infrastructure is in place before it is needed. It does not change how AtomOne operates day-to-day; no channels are opened by the upgrade itself. But it is a hard prerequisite for IBC communication with Gno chains, and by extension for the Validation-as-a-Service (VaaS) model AtomOne is developing — a shared security arrangement under which AtomOne validators provide consensus security to consumer chains. Gno.land is expected to be the first consumer chain once implementation readiness milestones are met on both sides. Without `10-gno`, neither the IBC channel establishment nor the cross-chain trust relationship that VaaS requires is possible.

## 8. Upgrade Handler Summary

The v4 upgrade is identified by `UpgradeName = "v4"` and is registered in `app/upgrades/v4/`.

**Store changes:**

| Operation | Key | Reason |
|---|---|---|
| Added | `coredaos` | New module |
| Added | `ibc_interchain_accounts_controller` | IBC-go v10 ICA controller |
| Deleted | `capability` | Removed from IBC-go v10 |

The governance store key (`gov`) is reused from v3. The migration rewrites all encoded values within it.

**Handler execution order:**

1. `mm.RunMigrations()` — triggers all registered module consensus version migrations. Relevant migrations: staking v5→v6 (adds `MaxCommissionRate` to params), distribution v3→v4 (initializes Nakamoto Bonus coefficient and params), governance v4→v5 (initializes participation EMAs and constitution placeholder).

2. `migrateGovState()` — re-encodes all governance store entries from `atomone.gov.v1` to `cosmos.gov.v1` Protobuf format using `AltValueCodec`, and sets new default param fields.

3. `migrateValidatorsCommission()` — sets staking `MinCommissionRate = MaxCommissionRate = 5%` and updates every existing validator's commission rate and `MaxRate` accordingly.

## 9. Client Migration and the v5 Boundary

For the duration of the v4 lifecycle, clients and frontends that query `atomone.gov.v1` endpoints will receive correctly-shaped, backward-compatible responses. No immediate changes are required.

The v4→v5 transition will remove the `atomone.gov.v1` wrapper entirely. Clients must migrate to `cosmos.gov.v1` before the v5 upgrade. The new governance endpoints (Governors, GovernanceDelegations, GovernorValShares) are available now only under `cosmos.gov.v1` — they have no `atomone.gov.v1` equivalents, since they did not exist in v3.

A summary of new message types introduced in v4 (all under `cosmos.gov.v1`):

```
MsgCreateGovernor          { address, description }
MsgEditGovernor            { address, description }
MsgUpdateGovernorStatus    { address, status }       // ACTIVE or INACTIVE
MsgDelegateGovernor        { delegator_address, governor_address }
MsgUndelegateGovernor      { delegator_address }
```

And new query endpoints:

```
QueryGovernor              { governor_address }
QueryGovernors             { status, pagination }
QueryGovernanceDelegation  { delegator_address }
QueryGovernanceDelegations { governor_address, pagination }
QueryGovernorValShares     { governor_address, pagination }
```

New `x/coredaos` messages:

```
MsgAnnotateProposal        { annotator, proposal_id, annotation, overwrite }
MsgEndorseProposal         { endorser, proposal_id }
MsgExtendVotingPeriod      { extender, proposal_id }
MsgVetoProposal            { vetoer, proposal_id, burn_deposit }
MsgUpdateParams            { authority, params }
```

## 10. Security Audit

The AtomOne v4 upgrade was subjected to a security audit carried out by [Oak Security](https://oaksecurity.io/). The full audit report is available at <PLACEHOLDER_LINK>.

---

## References

- [ADR-004: Nakamoto Bonus](https://github.com/atomone-hub/atomone/blob/main/docs/architecture/adr-004-nakamoto-bonus.md)
- [ADR-006: Governors](https://github.com/atomone-hub/atomone/blob/main/docs/architecture/adr-006-governors.md)
- [AtomOne Constitution](https://github.com/atomone-hub/genesis/blob/main/CONSTITUTION.md)
- [AtomOne SDK (atomone-hub/cosmos-sdk, release/v0.500.x)](https://github.com/atomone-hub/cosmos-sdk/tree/release/v0.500.x)
- [v4 upgrade handler](https://github.com/atomone-hub/atomone/blob/main/app/upgrades/v4/upgrades.go)
- [x/coredaos module](https://github.com/atomone-hub/atomone/tree/main/x/coredaos/)
- [x/gov wrapper](https://github.com/atomone-hub/atomone/tree/main/x/gov/)
- [modules/10-gno](https://github.com/atomone-hub/atomone/tree/main/modules/10-gno/)
