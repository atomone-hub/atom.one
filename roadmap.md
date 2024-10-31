# AtomOne Roadmap

(\*) Proposed AtomOne roadmap as per GovGen proposal #4: AtomOne Roadmap voted by the GovGen community.

</br>

```progressBar
[["General Completion ", 50]]
```

<br>
<br>

## Phase -2: Preparation

</br>

```progressBar
[["Completion", 100]]
```

</br>

1. **Drafting and Documentation: - 100% completed**
   - Draft the Articles of Constitution and complete the AtomOne proposed Constitution
   - Draft the initial Law documents for the proposed MVP DAOs: Steering, Oversight, and the first Treasury DAO - The Buidl DAO (to be used for chain development)\*
   - Draft the proposed AtomOne roadmap and tokenomics
2. **Proposing completed Articles: - 100% completed**
   - Begin proposing Constitution Amendments and Articles.
3. **Chain's supply distribution: 100% completed**
   - Complete the draft for the proposed ATONE supply distribution
4. **Software choice research 100% completed**
   - Complete the research for proposing the AtomOne launch software
     -\* The names of the proposed DAOs can be subject to change.\*

## Phase -1: Finalizing Founding Documents

</br>

```progressBar
[["Completion", 100]]
```

</br>

1. **Governance Approval - 100% completed**
   - Publish the AtomOne's proposed roadmap and submit it to Govgen for vote (feedback and sentiment).
   - Publish the AtomOne's proposed tokenomics and submit it to Govgen for vote (feedback and sentiment).
   - Publish the AtomOne's software choice proposal and submit it to Govgen for vote (feedback and sentiment).
   - Publish the AtomOne's supply distribution proposal and submit it to Govgen for vote (feedback and sentiment).
   - Publish the AtomOne proposed completed Constitution and submit it to Govgen for vote (feedback and sentiment).
2. **Complete the burn mechanism spec from ATONE to Photon - 100% completed**

## Phase 0: AtomOne Chain Launch

</br>

```progressBar
[["Completion", 50]]
```

</br>

1. **Launch** - 50%
   - Launch the AtomOne chain with a simple Gaia fork and no, to minimal changes with ICS and IBC functionalities disabled. - 100%
   - Ratify all governance documents on the AtomOne chain: Articles of Constitution and if required the proposed AtomOne roadmap and tokenomics 0%

## **Phase 1: Implementation**

</br>

```progressBar
[["Completion", 25]]
```

</br>

1. **New features/changes implemented**
   - Governance improvements - 50%
   - PHOTON mechanics - 50%
   - IBC, including relay & fee-based spam prevention. - 0%
   - Audit all of the above - 0%
2. **Photon activation** - 25%
   - ATONE -> PHOTON burn mechanism enabled
   - ATONE only used as fees for PHOTON burn tx
   - All fees collected in PHOTONs
3. **DAO Activation** - 0%
   - Complete the Charters for the Steering, Oversight, and the first Treasury DAO - The Buidl DAO\* and submit them to AtomOne for vote
   - Complete the Law documents for the proposed MVP DAOs and submit them to AtomOne for vote.
   - Approval of DAO members.
     - Propose through AtomOne:
       1. Steering Committee Members
       2. Oversight Committee Members
       3. The first Treasury DAO - The Buidl DAO Committee Members
     - Set up individual addresses for all Steering, Oversight members and for the first Treasury DAO - The Buidl DAO and KYC if needed
   - Launch the SteeringDAO, the Oversight DAO and the first Treasury DAO - The Buidl DAO with on-chain representation (AtomOne multisig addresses for each DAO)
   - Enable full functionality for root chain proposals. Ex:
     - Steering DAO can comment on root proposals.
     - Oversight DAO can halt root proposals.
     - Introduce new proposal types: Constitution, Law.
     - Introduce new transaction types: ex: Bend Time
   - Compile Constitution and afferent laws on-chain.
   - Maintain an off-chain system that stores the Constitution laws and charters.

## Phase 2: Validators, ICS Mechanics

</br>

```progressBar
[["Completion", 0]]
```

</br>

1. **Validator Incentives**

   - Fix validator incentives and election mechanics.
   - Implement rewards not strictly proportional to stake to avoid large validator dominance.

2. **ICS**
   - Propose the spec for the improved ICS model that: 1. ensures more or equal ICS rewards for validators. 2. collects and distributes ICS rewards according to work performed. 3. uses photons for all payments.
   - Deploy above ICS on AtomOne. \* Start draft on ICS++ specification w/ ABCI application containers. 1. ICS++ consumer chains are described by a linux container. 2. Develop orchestration tooling for ICS++ 3. Ensure TM1 &lt;-> TM2 IBC compatibility 4. Expand choice of supported consensus engines for consumer chains. (Hub runs TM1, initial ICS++ consumer chains run TM2 invisibly)

## Phase 3: Cross-Zone Governance

</br>

```progressBar
[["Completion", 0]]
```

</br>

1. **Expanded Oversight of the DAOs**
   - Allow Oversight DAO to reject proposals from other zones via root/core.
   - Enable Steering DAO to manage root hub parameters and pass them through IBC to shard treasury DAOs.
2. **Enable the creation and functionality of the other Treasury DAOs**
   - Enable the needed functionality for the creation of any treasury DAOs
