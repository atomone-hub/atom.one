---
title: "Building Better Blockchain Insights with tx-indexer"
publishDate: 2025-01-29T21:46:00-01:00
translationKey: "tx-indexer"
tags: [ "gnoland", "gno", "graphql", "jsonrpc" ]
level: Intermediate
author: wyhaines
summary: This highlights some of the unique and compelling features of the tx-indexer.
---

## Overview

**tx-indexer** is a tool from the Gno team that indexes Tendermint2 chain data and serves it via multiple protocols,
including via a GraphQL endpoint. The tx-indexer will allow you to query or subscribe to your chain’s blocks,
transactions, or custom message data in real time.

This showcase will

1. Introduce the **tx-indexer** and its main functionality.
2. Give you a quick run-down on how to setup the **tx-indexer** to start ingesting chain data.
3. Show you how to run a GraphQL query, to whet your appetite for what the tx-indexer can do.
4. Illustrate one example of how you can leverage the capabilities of tx-indexer via a monitoring tool like Grafana.

---

## What Does tx-indexer Do?

At a high level:

- **Indexes chain data**: It connects to your Gno chain via a specified `--remote` node URL and listens for new blocks
  and transactions.
- **Stores data locally**: It uses PebbleDB to store indexed data on disk.
- **Serves that data**: It provides a JSON-RPC 2.0 service (both HTTP and WebSocket) and a GraphQL endpoint to query or
  subscribe to new events.

For example, if you’re curious about how many contracts have been deployed on your chain, or how many transactions a
certain address has recently made, the **tx-indexer** can help you gather that data.

### GraphQL!? That Sounds Interesting!

While **tx-indexer** also provides standard JSON-RPC endpoints, the GraphQL interface is particularly convenient for
modern web and analytics workflows. You can craft complex queries that filter by message type, block height, or
transaction content and get exactly the data you need.

Furthermore, the GraphQL endpoint provides **subscriptions**, which allow you to receive real-time events. This is ideal
for dashboards that update with fresh data every few seconds.

---

## Getting Started

### 1. Build and Run

First, clone the repository and build the binary:

```shell
git clone https://github.com/gnolang/tx-indexer.git
cd tx-indexer
make build
```

Then, run the **tx-indexer** and point it to your Gno chain:

```shell
./build/tx-indexer start --remote https://rpc.test5.gno.land  -listen-address 0.0.0.0:8546 --db-path indexer-db
```

This will index data from `https://rpc.test5.gno.land` and store it in `indexer-db`. The GraphQL endpoint (and JSON-RPC
endpoint) will be available by default on port `8546` (configurable via the `--listen-address` flag).

> **Note**  
> The WebSocket endpoint is always at `ws://<listen-address>/ws` for local and insecure deployments, but will be
`wss://<listen-address>/ws` with secure deployments utilizing an SSL certificate. You’ll need the WS port if you plan on
> receiving subscription events over WebSocket.

### 2. Access the GraphQL Playground

Once the indexer is running, you can open your browser to:

```
http://localhost:8546/graphql
```

This launches the GraphQL Playground—an interactive interface where you can run queries, view schema documentation, and
experiment with filters.

---

## GraphQL in Action

### Real-Time Subscriptions with GraphQL

An extensive review of the GraphQL queries that are possible with the tx-indexer is beyond the scope of this article.
Future documentation delving into this in more detail may eventually be found in the gno.land documentation or
tutorials, but as a simple example, consider an event-driven workflow such as updating a dashboard or sending alerts
when new blocks appear. The GraphQL subscription feature can make this simple.

```graphql
subscription {
  blocks(filter: {}) {
    height
    version
    chain_id
    time
    proposer_address_raw
  }
}
```

When you run the above subscription in the GraphQL Playground, you’ll see real-time updates with each new block. You can
imagine hooking this into:

- **Grafana**: A custom data source plugin or a small middleware that pushes these block updates to Grafana panels in
  real time.
- **Alerts**: A Slack or Discord bot that triggers a message whenever a new block has some interesting condition (e.g.,
  block with a suspiciously large number of transactions).

---

## Extensive Possibilities!

### Example: Feeding GraphQL Data into Grafana

Grafana can visualize data stored in time-series databases like Prometheus. You could create a small service that:

1. Subscribes to new blocks or transactions via the GraphQL endpoint.
2. Parses out interesting metrics (block height, # of transactions, gas used, etc.).
3. Pushes those metrics into Prometheus.
4. Grafana then queries that database to display real-time charts.

For example, if you wanted a chart of “number of new packages deployed per hour,” you might:

- Listen to new blocks with the GraphQL subscription.
- For each block, retrieve relevant transactions that contain `MsgAddPackage`.
- Increment a counter in Prometheus labeled `gno_new_packages`.
- Grafana then reads `gno_new_packages` to display a time-series chart.

---

## Key Takeaways

1. **Easy Setup**: Start indexing your chain with a single command (`tx-indexer start ...`).
2. **GraphQL Power**: Use the GraphQL endpoint to craft specific queries for blocks, transactions, or messages, and only
   get the data you care about.
3. **Real-Time Subscriptions**: Receive push notifications on new blocks, perfect for live dashboards, bots, or
   triggers.
4. **Flexible Data Serving**: While GraphQL is the star for many modern use cases, you also have JSON-RPC endpoints for
   standard block and transaction retrieval.
5. **Future-Proof Analytics**: Any real-time analytics platform (Grafana, Kibana, custom event stream, etc.) can easily
   consume this data.

---

## Conclusion

**tx-indexer** is a powerful tool to enable visibility into a Tendermint2 chain like gno.land. With built-in GraphQL
queries and subscriptions, you can gain insight all aspects of chain activity, and you can feed that data into your
favorite observability stack or other applications.

### For More Information

[Check out the GitHub README](https://github.com/gnolang/tx-indexer/blob/main/README.md) for full usage details and
command-line flags.

We hope you find **tx-indexer** useful as you explore and build. Keep an eye out for more advanced guides on hooking up
metrics and building complex queries with the GraphQL endpoint. This was just a taste of what’s possible!
