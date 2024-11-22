# AtomOne FAQ

## 1. What is the AtomOne blockchain, and how might it benefit the Cosmos community?

AtomOne is a community-driven fork of the Cosmos Hub, originating from concerns raised around Cosmos Hub [Proposal 82](https://www.mintscan.io/cosmos/proposals/82/) and [Proposal 848](https://www.mintscan.io/cosmos/proposals/848/). AtomOne aims to provide a security-conscious, constitutionally governed, streamlined IBC/ICS hub, preserving the foundational ethos of the Cosmos Hub. By prioritizing security, scalability, and decentralization, and operating under a written constitution, AtomOne strives to establish a secure and adaptable platform for interchain security and decentralized governance. It seeks to enhance interoperability, foster inclusivity, and serve as a neutral, community-governed base within the Cosmos ecosystem.

## 2. Why the need for AtomOne?

The results of Proposal 848 highlighted a significant concern within the Cosmos Hub community, particularly around centralization, security, and governance limitations.

Many community members feel that the shift risks transforming ATOM into a monetary token, diverging from its original security-focused purpose. AtomOne, as a minimal fork of Gaia (the Cosmos Hub),aims to enhance security, transparency, and a more equitable distribution of voting power and rewards across validators while offering a more inclusive and flexible governance model. AtomOne’s mission is to be a decentralized, adaptable blockchain supporting Inter-Blockchain Communication (IBC) and Interchain Security (ICS), acting as a secure, neutral Hub that empowers communities to self-govern and innovate within the Cosmos ecosystem, ultimately aiming to strengthen and complement the network over the long term. AtomOne’s constitutionally grounded approach to governance and security ensures it remains a robust and secure platform, aligned with the original values of the Cosmos ecosystem, ultimately strengthening and complementing the network over the long term.

## 3. What might AtomOne mean for the original Cosmos Hub?

AtomOne is not intended to compete with the Cosmos Hub; instead, it aims to complement the Cosmos Hub by serving as a bridge to enhance security and introduce improved technical designs that can inform the Hub’s future development. AtomOne contributions may be upstream-merged to the Cosmos Hub and AtomOne will focus on steering the Cosmos Hub toward safer designs. By preserving hub minimalism, AtomOne can foster innovative solutions, such as smart contracts on ICS-secured shard chains, enriching the overall ecosystem.

## 4. How is AtomOne different from Cosmos Hub?

The main design elements that make AtomOne unique are:

- The existence of a live on-chain Constitution that outlines decision-making processes, representation, and community responsibilities, ensuring that governance reflects the collective vision of AtomOne’s participants.
- The creation of the dual token model ATONE- PHOTON, with each token fulfilling distinct roles to ensure the chain’s security and efficient transaction processing. ATONE is the native staking and governance token of AtomOne while PHOTON is the fee token for the initial AtomOne chain and for the future AtomOne Hub. PHOTON will serve as the sole fee token for all transactions on the root and core shards, as well as for Inter-Blockchain Communication (IBC) and Interchain Security (ICS) payments.
- The removal of a foundation entity that controls part of the genesis token allocation and replacement with a system of specialized treasury DAOs that ensure that fund management and resource allocation decisions are made through collective decision-making rather than a centralized authority, enhancing transparency and community-driven governance..
- The existence of an advisory DAO- the Steering DAO and of an supervisory DAO- the Oversight DAO to guide, advise and ensure compliance of all decisions with the Constitution and Laws.
- New Interchain Security (ICS) model that streamlines consumer shard deployment using containerization, allowing consumer chains to focus solely on application logic while AtomOne handles consensus and networking through a standard consensus engine.
- Improvements to the proof of stake delegation system by adjusting the delegation algorithm to distribute voting power more evenly among validators. This will increase the Nakamoto coefficient (a measure of decentralization) and make ICS (Interchain Security) more robust by ensuring validators have similar levels of delegated stake.
- The creation of a more equitable validators reward system that discourages excessive delegations to validators that have a high voting power, with the goal to encourage a healthier spread of delegation. This may include introducing a minimum staking requirement and distributing rewards in a way that supports a balanced validator set.

## 5. Does AtomOne have a Foundation?

No, AtomOne does not have a foundation or any controlling entity. As a community-owned and community-driven project, AtomOne operates under a DAO structure defined in its Constitution. This structure emphasizes true community governance by ensuring that all decisions—including funds management and resource allocation — are made collectively, rather than being controlled by a centralized entity.

## 6. When did AtomOne launch?

After months of extensive development and valuable community input, the proposed code freeze and initial genesis for the AtomOne chain were released on September 27th, marking the v.1.0.0 release ([https://github.com/atomone-hub/atomone/releases/tag/v1.0.0](https://github.com/atomone-hub/atomone/releases/tag/v1.0.0)). The community has played a key role in reaching this point, and the next steps were entrusted to the validator community to self-organize and potentially launch the AtomOne chain.

On October 18th, a group of community validators came together, submitted their genTXs, created a new genesis, and successfully launched the AtomOne chain. This was a fully decentralized, community-driven event, with no single entity controlling or deciding the genesis time —these decisions were made collectively by the self-organizing community genesis validators.

You can view the chain's activity and stats directly on the [Mintscan explorer.](https://www.mintscan.io/atomone)  
 As a permissionless, community-driven chain, anyone is welcome to join and become an AtomOne validator. If you're a validator and interested in shaping the future of the network, you can find the instructions on how to join the AtomOne chain [here](https://atom.one/developers).

## 7. What is ATONE, and how may it differ from ATOM?

ATONE is the native staking and governance token for AtomOne, created through a community-led hard fork of the Cosmos Hub. While both tokens will focus on securing their respective networks, ATONE is designed to maintain a ⅔ majority staked target to minimize attack vectors. Unlike ATOM, which might be evolving towards a monetary token, ATONE prioritizes security and upholds the original values of the Cosmos Hub while emphasizing minimalism as outlined in the AtomOne Constitution.

## 8. When was the distribution snapshot and how did ATONE tokens become available?

The ATONE distribution proposal considered how ATOM holders participated in Cosmos Hub Proposal 848\. If you held ATOM on November 25th, 2023 (when the voting period ended) you were eligible for the ATONE airdrop.

The ATONE token distribution was approved by the GovGen community with a 40.56% vote turnout, resulting in the allocation of 96,997,800 ATONE tokens to 1,128,299 Cosmos Hub (ATOM) addresses. Additionally, 5,388,766 ATONE were allocated to the Community Pool and 5,388,766 ATONE were allocated to a reserved address for the future funding of the AtomOne Treasury DAO, making the total ATONE genesis supply 107,775,332 tokens. You can verify your ATONE allocation directly in your wallet (see point \#6 above) or by checking the AtomOne airdrop tracker [here](https://govgen.io/#trackers). For more information read the [AtomOne Distribution article](https://x.com/_atomone/status/1852103987950162034).

## 9. How can I stake ATONE?

AtomOne token holders can stake their ATONE tokens using different options:

- CLI tool, ideally by using an offline computer. You can find instructions [here](https://atom.one/submit-tx-securely).
- [https://staking.atom.one/](https://staking.atom.one/) dApp
- [Cosmostation](https://www.cosmostation.io/products/cosmostation_extension) wallet (natively within the wallet)
- [Leap](https://www.leapwallet.io/download) wallet (natively within the wallet)
- [Keplr](https://www.keplr.app) wallet (by going to Keplr’s [chain registry page](https://chains.keplr.app) and manually adding the AtomOne chain)
- [Mintscan.io](http://Mintscan.io) interface where token holders can connect their Keplr or Cosmostation wallets (If you have not added the AtomOne chain to Keplr as described above, it will be added through the add suggested chain feature)

## 10. What is PHOTON?

PHOTON serves as the transaction fee token for the initial AtomOne chain and for the future AtomOne Hub. It is the sole fee token for all transactions on the root and core shards, as well as for Inter-Blockchain Communication (IBC) and Interchain Security (ICS) payments.

The only way to mint PHOTON tokens is through the burning of ATONE tokens. The total mintable PHOTON supply is capped at 1 billion tokens. This mechanism ensures a controlled and transparent supply of PHOTON, tied directly to the burning of ATONE. Once ATONE tokens are converted into PHOTON, they cannot be converted back. This one-way conversion helps in maintaining the economic structure and stability of the AtomOne chain.

## 11. How can I contribute to AtomOne?

Anyone can contribute to AtomOne as a community-driven initiative, with a collaborative decision-making process. If you value hub minimalism for security and sustainability, join the movement. If you would like to contribute, sign up for a GitHub account (if you don’t already have one) and head over to the [AtomOne org.](https://github.com/orgs/atomone-hub/repositories)

You can join an existing discussion in the “Issues” section, selecting the topic that interests you, and adding your comment, or you can open a new discussion by starting a new Issue or adding a Pull Request. Alternatively, join the [AtomOne Discord](https://discord.gg/atomone) channel.

As AtomOne continues to evolve, the community is encouraged to take an active role in shaping its future. The AtomOne community is urged to remain active, by submitting and discussing new proposals, on the forum and voting for upcoming on-chain proposals.

You can follow AtomOne progress directly on the [AtomOne repo](https://github.com/atomone-hub), joining [AtomOne Discord](http://discord.gg/atomone) or by getting familiar with the [AtomOne proposed roadmap](https://app.govgen.io/proposals/4) to learn more about the upcoming proposed functionalities and developments of the AtomOne chain.

Participants can also apply for grants and bounties through [the AiB Grants and Bounties Program](https://github.com/allinbits/grants/tree/main/AiB-BUIDL-Grants-and-Bounties-program), which offers support for those contributing to the development of the AtomOne chain or directly submit a spending proposal to the AtomOne community using the Community Pool.

## 12. How can I become a validator on AtomOne?

AtomOne uses a Proof-of-Stake delegation system similar to Cosmos Hub, with some future modifications that are aiming to improve the distribution of voting power and rewards across validators. The incentive system will be driven by the AtomOne community.

As a permissionless, community-driven chain, anyone is welcome to join and become an AtomOne validator. If you're a validator and interested in shaping the future of the network, you can find the instructions on how to join the AtomOne chain [here](https://atom.one).

## 13. How is the developer activity encouraged on the platform, and how is development of the chain funded?

An allocation was set aside in the original genesis distribution for development purposes. AtomOne may support DAO systems and smart contracts to specify developer payments transparently on-chain. On-chain governance will determine AtomOne’s scope and further define its Constitution.

## 14 If validators who voted YES are slashed, how will additional validators be secured to ensure the chain is decentralized?

By slashing the Yes voters, the AtomOne's distribution ensured that those who are not aligned with its vision have less voting percentage than the others. This is a safety measure to prevent non-aligned decisions from being adopted, as has happened within the Cosmos Hub

## 15. What is the plan for scaling AtomOne?

AtomOne aims to scale transaction throughput through a modified version of ICS (Scaled Security). AtomOne is expected to maintain hub minimalism; the best way to scale to accommodate a broader user base. This approach is expected to capture the market's need for security in IBC token transactions and ICS shard hosting. Scaling and security questions are expected to be further addressed by community contributions and development.

## 16. Will AtomOne use Cosmos Hub’s shared security?

The AtomOne hub is expected to have its own ICS model (Scaled Security) to scale permissionless blockchain applications for influx of users for efficient intra-hub communication without sacrificing security and leveraging Linux container technology. However, how scaled security and other potential features develop is intended to be addressed in more detail by further community contributions and development.

## 17. Now that AtomOne has launched, how can the community assist with marketing the chain?

AtomOne is a community driven chain, therefore any marketing effort to promote the chain would have to be agreed by the community. Now that the chain has launched, the community would need to focus on creating the Marketing DAO amongst other DAOs. In order to do so, the community would need to work on forming a proposal to the community in order to elect the members of the Marketing DAO. We are certain that there are several skilled candidates that will respectfully form the DAO. The Marketing DAO will lead all future efforts in marketing the chain.
