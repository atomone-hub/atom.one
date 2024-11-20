# Atom One

## Operate the node

### Genesis file

The link to the final genesis is available here:

[https://atomone.fra1.digitaloceanspaces.com/atomone-1/genesis.json](https://atomone.fra1.digitaloceanspaces.com/atomone-1/genesis.json)

### Get the binary

- You can download the proposed chain binary from github release page

[https://github.com/atomone-hub/atomone/releases/tag/v1.0.0](https://github.com/atomone-hub/atomone/releases/tag/v1.0.0)

- Or you can build it from the source

You need to have [go](https://go.dev/doc/install) installed

```sh
$ git clone https://github.com/atomone-hub/atomone.git
$ cd atomone
$ git checkout v1.0.0
$ make build  # compile in the ./build directory
```

To ensure [reproducible builds](https://github.com/atomone-hub/atomone#reproducible-builds),
AtomOne requires go1.21.13, so if you use a different version, `make build`
will output the instructions required to use the expected go version.

### Setting recommendations

| minimum-gas-prices | 0.001uatone                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| seeds              | see [seeds.txt](https://github.com/atomone-hub/atomone-validator-community/blob/main/atomone-1/seeds.txt)                       |
| persistent_peers   | see [persistent_peers.txt](https://github.com/atomone-hub/atomone-validator-community/blob/main/atomone-1/persistent_peers.txt) |

### Hardware recommendations

AtomOne is a relatively simple and vanilla Cosmos SDK chain with minor modifications. The recommended minimum hardware requirements should be enough to comfortably be able to run a validator node.

- 4 Cores
- 8 GB RAM
- 512 GB disk space (could increase over time, will need to monitor disk usage)

### Network informations

The following public RPC and API endpoints are available:

- [https://atomone-api.allinbits.com](https://atomone-api.allinbits.com) <!-- markdown-link-check-disable-line -->
- [https://atomone-rpc.allinbits.com](https://atomone-rpc.allinbits.com)

Addtional explorers, RPCs, seed nodes, persistent_peers, etc. may be listed on [cosmos.directory/atomone](https://cosmos.directory/atomone)

### Check your AtomOne allocation

<br/>

<div class="js-tracker">
 <input class="js-tracker-input tracker-input" placeholder="Input your Cosmos public address" />
 <button class="js-tracker-check ">Check ATONE Balance</button>
 
 <div class="js-tracker-result is-hidden tracker-balance">
  <span class="js-tracker-balanceResult "></span>
 </div>

 <div class="js-tracker-result is-hidden tracker-balance-detail">
  <div>TOTAL AIRDROP = YES + NO + NWV + ABS + DNV + LIQUID ≃ <span class="js-tracker-balanceTotal"></span> ATONE</div>
  <div class="tracker-info">According to ATONE distribution proposal discussed on the GovGen forum</div>
 </div>
</div>

### Discord channel

For more immediate communication, you are also welcome to use [the validator channel on Discord](https://discord.com/channels/1050058681414340701/1052259303924445204).

## Submit transactions using the CLI

We wrote a comprehensive guide to securely submit transactions using the CLI,
you can find it [here](submit-tx-securely.md).
