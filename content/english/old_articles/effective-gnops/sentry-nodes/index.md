---
title: "Sentry Nodes: The Good, The Bad and the Ugly"
publishDate: 2025-01-28T08:00:00-01:00
translationKey: "sentry-nodes"
tags: [ "sentry", "architecture", "nodes" ]
level: Advanced
author: zivkovicmilos
summary: This explainer details the sentry node architecture (nodes that sit between the public internet and the validator), that greatly reduces direct exposure to potential attacks. This setup helps mitigate DDoS threats, preserves uptime, and fosters a more robust network infrastructure.
---

## Overview

Sentry nodes have become a widely adopted strategy for blockchain validators, mainly due to their ability to bolster
security. However, as with most tech solutions, they're not without their drawbacks and potential pitfalls. Below,
we'll explore benefits, as well as issues with adopting a Sentry node architecture.

## What is a Sentry node?

At its core, a **Sentry node** is a simple blockchain node placed between your validator node and the public
internet. It does not need to be a full node, it can also be a light client.

Rather than advertising your validator's IP address to the entire network (and possible attackers), you
configure the sentry nodes as the "public-facing" endpoints. Your validator node then connects only to these
intermediary sentry nodes, staying safely tucked behind an additional layer of security, in a private network cluster.

Think of sentry nodes like bodyguards who interface with the outside world -- they handle inbound and outbound requests
so that your validator doesn't have to.

Sentry nodes rely exclusively on the p2p layer of the blockchain network to "shield" the validators they are relaying
for. They utilize the gossip layer of the network to transmit consensus messages to the validators. The validators
themselves only have the sentry nodes as their peers, and use them for synchronizing the network state.

## The Good

### 1. Stronger Security

- **DDoS Mitigation**  
  Because the validator node's IP isn't advertised, it's significantly harder for malicious actors to target it with a
  Distributed Denial of Service (DDoS) attack. Any attempt at overwhelming your validator will likely be directed at the
  sentry nodes instead -- shielding the core of your cluster.

- **Isolation from Direct Attacks**  
  By keeping the validator node private, you reduce the risk of exploits that may stem from zero-day vulnerabilities or
  misconfigured clients. Your validator can operate in a tightly controlled environment with minimal external exposure.

### 2. Network Stability and Redundancy

- **Minimized Downtime**  
  Validators play a critical role in block production. If a sentry node is overwhelmed or fails, you can
  operate multiple sentries to ensure your validator stays connected and online.

- **Load Balancing**  
  Distributing traffic across multiple sentry nodes helps avoid bottlenecks. If one sentry becomes a target of heavy
  traffic, another can step in to manage the load, maintaining stable performance.

### 3. Flexibility and Scalability

- **Scaling for Multiple Chains**  
  Many validators choose to run nodes for multiple blockchains. You can scale up the number of sentry nodes
  without drastically changing your underlying validator configuration - great for future growth.

- **Customizable Configurations**  
  You can place sentry nodes in different geographic locations, on various cloud providers, or even on-premise. This
  variety not only bolsters redundancy but also allows you to optimize for latency and performance.

## The Bad

### 1. Increased Complexity

- **More Infrastructure Components**  
  Implementing a Sentry node architecture isn't as straightforward as running a single validator node. You'll need to
  configure and maintain multiple machines, handle firewall rules, handle traffic forwarding, and manage secure
  communications between sentries and your validator.

- **Higher Operational Costs**  
  Running extra nodes means increased hosting fees and hardware expenses. Even if you're using cloud-based solutions,
  each sentry node has its own associated costs in terms of storage, bandwidth, and compute resources.

### 2. Configuration Overhead

- **Firewall and Networking**  
  Properly setting up sentry nodes requires robust firewall rules that only allow connections between your validator and
  the sentry nodes. Any misconfiguration could inadvertently expose your validator or block necessary communication.

- **Monitoring and Maintenance**  
  Each additional node needs monitoring. If a sentry goes down, you'll need to identify the root cause quickly - whether
  it's a hardware failure, a networking issue, or a targeted attack.

## The Ugly

### 1. Misconfigurations Can Hurt More Than They Help

- **Inadvertent Exposure**  
  If you accidentally expose your validator IP address while trying to configure your sentry nodes, attackers can target
  your validator directly. This negates the core advantage of having a sentry architecture in the first place. This
  assumes your validator node is reachable and doesn't have connection rules of its own.

- **Single Points of Failure**  
  Over-reliance on a single cloud provider or region can create a hidden single point of failure. If that provider
  experiences an outage or a large-scale attack, all of your sentries (and therefore your validator) could be affected
  simultaneously.

### 2. Potential for Over-Engineering

- **Overcomplicating Simple Needs**  
  For smaller operators or those just starting out, setting up multiple sentry nodes and complex firewalls might be
  overkill. A simpler configuration, well-secured and closely monitored, can sometimes be just as effective (especially
  when resources are limited).

- **Performance Degradation**  
  If you route all traffic through geographically distant sentry nodes or over-complicate your network path, you might
  introduce unnecessary latency or lose important peer connections. This can lead to slower block confirmations or
  missed blocks in extreme cases.

## Why It's Still Worth the Effort

Despite its challenges, the Sentry node architecture is widely considered best practice for professional validators in
blockchain ecosystems like Gno. The extra layers of security, the ability to mitigate DDoS attacks, and the flexible,
scalable nature of this setup far outweigh the potential challenges -- especially for high-stakes or enterprise-level
validators who can't afford significant downtime or reputational damage.

When implemented correctly, **sentry nodes** are a powerful tool that strikes a balance between accessibility and
security, ensuring you can continue participating in block production without constantly worrying about external attacks
or single points of failure.

## Configuring a Sentry node architecture in `config.toml`

While firewall rules and infrastructure setup are crucial parts of implementing a Sentry node architecture, your
**`config.toml`** files for both the validator and sentry nodes also play a critical role. Below is a simplified
overview of how you might configure these files. Note that specific parameter names and best practices can vary
depending on the network topology you aim to have.

**NOTE: these example commands assume the default p2p port of `26656`. Please change the port number if it's something
different for your setup**

### On the Validator node

1. **Hide the Validator's External IP**
   You generally want your validator to avoid advertising its own IP. This can be achieved by leaving `external_address`
   blank or set to a private LAN IP if your infrastructure allows.

2. **Listen on all interfaces**  
   Generally, since the validator machine is in a private network pocket, you'd want to set the `p2p.laddr` to be bound
   to all interfaces (`0.0.0.0`).

```shell
gnoland config set p2p.laddr 0.0.0.0:0
```

3. **Connect only to your Sentry nodes**  
   Set the `persistent_peers` to reference **only** your sentry nodes. This ensures the validator does not accept
   connections from any unknown peers.

```shell
# Make sure the external address is not set, or is a private IP if needed
gnoland config set p2p.external_address "" # or  "tcp://<private_ip>:26656" 

# Use the sentries as the persistent peers
gnoland config set p2p.persistent_peers "sentryNodeID1@<sentry_ip1>:26656,sentryNodeID2@<sentry_ip2>:26656"

# Optionally, you can reduce the max inbound/outbound peers if you only want to connect to sentries.
# Make sure that for inbound / outbound limits, you respect the dialing direction (sentry -> validator or vice-versa)
gnoland config set p2p.max_num_outbound_peers 2 # if you have 2 sentries

# NOT recommended, but is an option if you want tighter control:
gnoland config set p2p.max_num_inbound_peers 0 # if no sentries are gonna dial the validator, but the other way around
```

4. **Disable peer exchange**
   The Validator nodes are valid participants in the network, but use the Sentry nodes as relays. Make sure they
   don't participate in the peer exchange process with other nodes.

```shell
gnoland config set p2p.pex false
```

### On the Sentry node

1. **Publicly advertise the Sentry**
   Unlike the validator, each sentry node should have a reachable external address so that it can connect with other
   peers.

```shell
gnoland config set p2p.external_address "tcp://<sentry_public_ip>:26656"
```

2. **Connect to the Validators**
   Your sentry node will list the validators it's guarding as a persistent peers. **NOTE: in some kube environments,
   it's impossible to know the IP of the validator node pod. In this case, it is strongly encouraged to use DNS for the
   validator location.**

```shell
gnoland config set p2p.persistent_peers "validatorNodeID@<validator_private_ip>:26656"
```

3. **Connect to other Sentries (if any)**
   If you're running multiple Sentry node clusters in your setup, make sure that sentries have each other in their
   persistent peer lists.

```shell
gnoland config set p2p.persistent_peers "...,sentryNodeID2@<sentry_ip2>:26656"
```

4. **Make the validator peers private**
   By setting the peer IDs of the validator nodes as private in the Sentry configuration, their information is not
   shared with other nodes in the peer discovery process.

```shell
gnoland config set p2p.private_peer_ids = "validatorNodeID"
```

5. **Enable peer exchange**
   The Sentry nodes are valid participants in the network. Make sure they participate in the peer exchange process with
   other nodes.

```shell
gnoland config set p2p.pex true
```

6. **Connect with the rest of the network**
   You can add official bootnodes nodes or well-known peers to ensure your sentry node participates in gossip and block
   propagation.

```shell
gnoland config set p2p.seeds "<seed_id_1>@<seed_ip_1>:26656,<seed_id_2>@<seed_ip_2>:26656"
```

## Conclusion

In conclusion, while Sentry node architectures do add extra complexity to your setup, the trade-off in security,
redundancy, and overall resilience is typically well worth it -- especially for those operating on high-stakes networks.

By carefully configuring your sentry and validator nodes, monitoring performance, and planning for redundancy, you'll be
far better equipped to withstand malicious attacks and unexpected downtimes. Sentry nodes essentially serve as a
dedicated layer of protection, allowing you to confidently focus on producing blocks and growing your operation without
constantly worrying about exposing your validator to the open internet.
