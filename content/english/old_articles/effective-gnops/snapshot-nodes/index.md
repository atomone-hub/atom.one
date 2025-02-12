---
title: "Snapshot nodes: Backups and fast syncronization"
publishDate: 2025-01-29T14:00:00-01:00
translationKey: "snapshot-nodes"
tags: [ "snapshot", "architecture", "nodes" ]
level: Advanced
author: albttx
summary: Snapshot nodes enable rapid blockchain synchronization by providing a block state, allowing new or recovering nodes to quickly start with the latest version of the network. This approach significantly reduces sync time and resource usage, making it easier for participants to join or maintain nodes in the Gno.land ecosystem.
---

Snapshot nodes are a crucial component in blockchain ecosystems, providing reliable infrastructure for rapid network synchronization. These snapshots allow validators and other network participants to quickly synchronize with the network by downloading the blockchain state. This article explores how to create snapshots and where to store them.

## What is a Snapshot Node?

A snapshot node is essentially a standard Gno.land node with an additional feature: a script that periodically stops the node, backs up the data folder, and restarts the node. This process typically occurs every few hours, depending on the configuration.

## Types of Snapshots

There are two main types of nodes that can produce snapshots:

1. **Full Node**: Contains the entire state of the blockchain since block 1. While these snapshots can be large, they allow users to recover data from any block. It's commonly called an **archive node**.

2. **Pruned Node**: Contains partial states of the blockchain. Currently, pruned nodes are not possible in Gno.land, but there is an ongoing issue ([gnolang/gno #3637](https://github.com/gnolang/gno/issues/3637)) addressing this feature.

## Creating and Managing Snapshots

Here's a step-by-step guide on how to run a snapshot node:

### Requirements

- A [Gno.land](https://github.com/gnolang/gno) node
- [lz4](https://github.com/lz4/lz4) for high compression
- [Docker](https://docker.com)

For this example, we'll run our Gno.land node inside a Docker container using Docker Compose.

### Step 1: Set up the Docker Compose file

Create a `docker-compose.yml` file with the following content:

```yaml
services:
  gnoland:
    image: "ghcr.io/gnolang/gno/gnoland"
    command: ["start", "--lazy"]
    ports:
      - 26657:26657 # ensure RPC listens on 0.0.0.0
    volumes:
      - ./gnoland-data:/gnoland-data
```

### Step 2: Start the node

```bash
docker compose up -d
```

### Step 3: Stop the node and backup the latest height

```bash
export LATEST_HEIGHT=$(curl -s localhost:26657/status | jq -r '.result.sync_info.latest_block_height') \
  && docker compose stop
```

### Step 4: Compress the data folder

Here, we compress only the `wal` and `db` directory inside of the `gnoland-data` folder which contains blocks states.

```bash
export CHAIN_ID="dev"
export DAEMON_HOME="./gnoland-data"
export FILE="gnoland-${LATEST_HEIGHT}-${CHAIN_ID}.tar.lz4"

tar cvf - -C ${DAEMON_HOME} wal db | lz4 > $FILE
```

### Step 5: Restart the node

```bash
docker compose up -d
```

## Setup a new node from a snapshots

### Step 1: Init a new gnoland node

```shell
$ gnoland config init

$ gnoland secrets init
```

### Step 2: Download and extract snapshots data

```shell
$ curl -o - -L $SNAPSHOTS_URL | lz4 -c -d - | tar -x -C ./gnoland-data
```

## Storing and Sharing Snapshots

To make snapshots accessible, you can use a simple file browser. Here's how to set it up using [filebrowser](https://github.com/filebrowser/filebrowser):

1. Add the following service to your `docker-compose.yml`:

```yaml
services:
  filebrowser:
    image: filebrowser/filebrowser:latest
    ports:
      - "8080:80"
    volumes:
      - ./snapshots:/srv
    environment:
      - FB_BASEURL=/files
    command: --noauth
```

2. Place all your snapshots inside the `/snapshots` directory.

3. Access the file browser at [http://localhost:8080](http://localhost:8080).

## Best Practices

1. **Regular Snapshots**: Create snapshots at consistent intervals to ensure up-to-date backups.

2. **Retention Policy**: Implement a retention policy to manage storage space, keeping only the most recent snapshots.

3. **Verification**: Regularly verify the integrity of your snapshots to ensure they can be used for restoration.

4. **Security**: If exposing snapshots publicly, implement proper access controls and consider using HTTPS.

5. **Documentation**: Maintain clear documentation on how to use the snapshots for node synchronization.

By implementing snapshot nodes, the Gno.land ecosystem can significantly reduce sync time and resource usage for new or recovering nodes, making it easier for participants to join or maintain nodes in the network.

## Example

You can find an example in [github.com/gnolang/hackerspace](https://github.com/gnolang/hackerspace/tree/main/snapshots-node)
