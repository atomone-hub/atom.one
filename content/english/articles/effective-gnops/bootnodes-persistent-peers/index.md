---
title: Bootnodes vs Persistent Peers
publishDate: 2025-01-21T08:00:00-01:00
translationKey: "bootnodes-persistent-peers"
tags: [ "bootnodes", "persistent", "peers", "discovery" ]
level: Beginner
author: zivkovicmilos
summary: This explainer covers the subtle differences between bootnodes and persistent peers in gno.land and TM2.
---

## Overview

"Bootnodes" and "Persistent peers" serve different, but complementary, roles in Tendermint2 P2P networks. While both are
crucial for achieving a healthy and well-connected network, they differ in how they
facilitate peer discovery and ongoing connectivity.

## Bootnodes (seed nodes)

Bootnodes function primarily as initial points of contact for new or restarting nodes.

When your node is first launched, it reaches out to the configured bootnodes and requests a list of other active peers
in the network. Bootnodes thus serve as “introducers,” allowing your node to discover a broader set of peers. Crucially,
connections with bootnodes are often ephemeral: once your node has obtained enough information to locate and connect to
other peers in the network, it may not need to stay connected to the bootnodes. Their key value lies in ensuring that
any new node can quickly bootstrap itself into the broader network, through the discovery process.

Bootnodes can be set using the `gnoland config` command suite, for example:

```bash
gnoland config set p2p.seeds g1s0x78pl3c2xv2n7hp33lh4jkyqvhg5hlx6huh7@gnocore-sentry-svc-01:26656,g1jeta40dllwtrh293498hq0dh0cr3u4gw77h5rc@gnocore-sentry-svc-02:26656
```

The `p2p.seeds` should contain the external peer addresses of peers, along with the peer ID (called the p2p
address).

### External Address

In TM2 networks, external addresses refer to the public-facing IP address and port combination through
which a node can be reached by other peers in the network. These addresses enable direct connections
between nodes, especially in environments where network configurations like NAT or
firewalls may obscure the node's actual network presence.

When a node advertises its external address, it allows other peers to initiate communication by connecting to this
publicly known endpoint. This is particularly important for nodes acting as validators, persistent peers, or bootnodes,
as they must be easily reachable to maintain the network's stability and connectivity.

### Peer Discovery

Every blockchain node needs an adequate amount of peers to communicate with, in order to ensure smooth functioning. For
validator nodes, they need to be *loosely connected* to at least 2/3+ of the validator set in order to participate and
not cause block misses or mis-votes (loosely connected means that there always exists a path between different peers in
the network topology, that allows them to be reachable to each other).

The peer discovery service ensures that the given node is always learning more about the overall network topology, and
filling out any empty connection slots (outbound peers).

This background service works in the following (albeit primitive) way:

1. At specific intervals, `node A` checks its peer table, and picks a random peer `P`, from the active peer list.
2. When `P` is picked, `node A` initiates a discovery protocol process, in which:
    - `node A` sends a request to peer `P` for his peer list (max 30 peers)
    - peer `P` responds to the request

3. Once `node A` has the peer list from `P`, it adds the entire peer list into the dial queue, to establish outbound
   peer connections.

This process repeats at specific intervals. It is worth nothing that if the limit of outbound peers is reached, the peer
dials have no effect.

## Persistent Peers

Persistent Peers, on the other hand, exist to maintain ongoing, reliable connections. When you specify certain nodes as
persistent peers, your node will continually attempt to stay in touch with them. If the connection to a persistent peer
drops due to network issues or a node restart, your node will make repeated attempts to reconnect (with a backoff). This
leads to a stable mesh of interconnected nodes that remain well-linked and reliably exchange data over time.
Persistent peers are therefore essential for establishing a core layer of consistent connectivity, often used to keep
critical infrastructure (sentry nodes) or validator nodes in sync.

Persistent peers can be set using the `gnoland config` command suite, for example:

```bash
gnoland config set p2p.persistent_peers g1s0x78pl3c2xv2n7hp33lh4jkyqvhg5hlx6huh7@gnocore-sentry-svc-01:26656
```

The `p2p.persistent_peers` should contain the external peer addresses of peers, along with the peer ID (called the p2p
address).

## Summary

The main differences can be understood in two dimensions: function in the network lifecycle and connection behavior.
Bootnodes help your node find peers when it **first** joins the network and do not need to remain connected afterward.
By contrast, persistent peers ensure your node's connectivity persists by relentlessly re-establishing links if they are
ever lost.

In summary, bootnodes are about discovery, while persistent peers are about stability. By combining both effectively,
you can ensure a node quickly locates its initial set of neighbors and then remains connected through a stable
network of persistent peers.