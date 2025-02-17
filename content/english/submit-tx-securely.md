---
meta_title: "How to Submit Transactions Securely to AtomOne: Step-by-Step Guide"
meta_description: "Learn how to securely sign and broadcast AtomOne transactions using offline and online methods. Protect your AtomOne account with these best practices."
---

# Submitting a Transaction to AtomOne - and How to Submit Transactions Securely

> [!WARNING]
> THE [`atomoned`](https://github.com/atomone-hub/atomone) BINARY MENTIONED IN
> THIS PAGE **HAS NOT BEEN AUDITED YET**.
>
> PLEASE USE **EXTREME CAUTION** WHEN USING THIS SOFTWARE, AND USE IT AT YOUR OWN RISK.
> FOR THE TIME BEING, WE ADVISE THAT YOU NOT USE IT WITH YOUR PERSONAL PRIVATE KEY(S).
>
> THIS IS **ESPECIALLY IMPORTANT** AS ATOMONE RELIES ON AND USES ACCOUNTS DERIVED FROM
> THE COSMOS HUB, AND THEREFORE THERE IS RISK OF COMPROMISING YOUR COSMOS HUB
> ACCOUNT AS WELL.

This guide illustrates the best practices for signing and broadcasting
transactions to AtomOne, but the general concept is applicable more broadly to
almost any blockchain, and commands on other [Cosmos
SDK](https://github.com/cosmos/cosmos-sdk) chains will be very similar if not
identical. It will show in particular how to delegate to a validator
using the Command Line Interface (CLI), but the process applies in general to
any transaction. We will also briefly explore this at the end of the guide.

The guide presumes that your **account data** is stored on an **offline
computer** (but not the private key if you are using a hardware wallet as we
recommend everyone to do). This offline machine is used to **create** (although
you can use any computer for this) and **sign** a transaction. Following this,
a **separate online computer** is used to **broadcast** the signed transaction.
The whole process will make use of the AtomOne CLI available with the [AtomOne
chain software](https://github.com/atomone-hub/atomone).

Performing the signing of transactions on an offline computer is the safest way
to limit the efficacy of potential malware, viruses, or malicious software,
thus protecting your account. Even if the computer were to be compromised for
any reason, it would be unable to send data to a potential attacker.

> [!NOTE]
> An offline computer refers to a machine that is _never_ connected to the
> internet. Therefore, a machine that is intermittently connected is **NOT**
> considered an offline computer.

> [!IMPORTANT]
> If you find any security issue/concern in this document, please send an email
> to security@allinbits.com.

## Prerequisites

### 1. Download the `atomoned` binary

- Go to https://github.com/atomone-hub/atomone/releases/tag/v1.0.0 (or the
  [latest available release](https://github.com/atomone-hub/atomone/releases)
  used by the AtomOne chain)
- Download the binary that corresponds to your OS
- Download the file `SHA256SUMS-v1.0.0.txt`
- Make sure that the `sha256sum` of the binary you have downloaded matches the
  `sha1sum` listed in that file. From a terminal window type:

```bash
sha256sum -c --ignore-missing SHA256SUMS-v1.0.0.txt
```

```bash
atomoned-v1.0.0-linux-amd64: OK
```

- Safely copy the binary into your **offline** and **online computers**, to a
  directory present inside your `$PATH` environment variable (like
  `$GOPATH/bin`, `usr/bin` or `/usr/local/bin`), to make it accessible for
  execution. Alternatively, you can bypass this step and run `atomoned` using
  its full path. In the following code snippets, use `./path/to/atomoned`
  instead of just `atomoned`.

> [!IMPORTANT]
> The binary from the github release section doesn't have Ledger support. If
> you want to sign your transactions using a Ledger, you need to build the
> binary from the sources using `make build-ledger`.

### 1.a. Build the `atomoned` binary [alternative]

Alternatively, you can also build the `atomoned` binary by cloning the
repository and doing `make install` on both the **offline** and **online
computers**. Note that you will have to manually copy the cloned repository on
the offline computer as obviously it won't be able to access the remote
resource, or more easily copy over the built binary if you wish to do so
alternatively (you can know its location on the online computer typing `which
atomoned`):

```bash
git clone --branch v1.0.0 --depth 1 https://github.com/atomone-hub/atomone.git
cd atomone && make install
```

To build `atomoned`, you will require **Go 1.21.13** specifically. If you have a
newer version, which is likely, `make install` will output the instruction to
build using the required version without changing your current Go installation.

These instructions are:

```bash
go install golang.org/dl/go1.21.13@latest
go1.21.13 download
cd /path/to/atomoned
GOROOT=$(go1.21.13 env GOROOT) PATH=$GOROOT/bin:$PATH make install
```

After the command has been executed, verify your binary and ensure it produces
the following output (for version v1.0.0):

```bash
atomoned version --long
```

```bash
commit: 2d6996e6f7e87330b40e945978778708bb9651d3
cosmos_sdk_version: v0.47.13
go: go version go1.21.13 linux/amd64
name: atomone
server_name: atomoned
version: v1.0.0
```

Similarly to the download step, and because AtomOne has reproducible builds,
you can assert that the compiled binary has the same signature than the one
from the github release:

- Download the file `SHA256SUMS-v1.0.0.txt` at the [github release page][v1.0.0]
- Make sure that the `sha256sum` of the binary you have compiled matches the
  `sha1sum` listed in the file that corresponds to your OS/architecture.

```bash
cat SHA256SUMS-v1.0.0.txt
9e9ba6fda17e9791d5ea38e93807cd6dbd2af3a1a3e1dc97bfae26b9cb2fb201  atomoned-v1.0.0-darwin-amd64
1f412ab27ca74de7ead3e0f27389b5e1ed5369fab43dbb381abdc021c76d5e21  atomoned-v1.0.0-darwin-arm64
78fcb6bcda906fc5b959cca985afab5a8486c17b63e1835faec0c0e57364582d  atomoned-v1.0.0-linux-amd64
434c10a2007a01734fc353acc1b4082099b1f6c99b81371ddf4df3bf5f2f27d6  atomoned-v1.0.0-linux-arm64
4ee28cfca97590d156f59249acf4c2ae21974728a3e0f55a1382abab8e8e3436  atomoned-v1.0.0-windows-amd64.exe
e29e5bc3aff354caf100fcaad35a9e0173276dd6a5f162a8939dee5f30c9b69e  atomoned-v1.0.0-windows-arm64.exe
```

```bash
sha256sum $GOPATH/bin/atomoned
78fcb6bcda906fc5b959cca985afab5a8486c17b63e1835faec0c0e57364582d  build/atomoned
# match the hash of linux/amd64 version
```

> [!WARNING]
> If you use `go install ./cmd/atomoned` or any other method besides `make
install` or `make build` to build the binary, you won't be able to have the
> same signature hash than the ones of the github release.

### Ledger support

If you want to sign your transaction using a Ledger device, you need to use an
alternate build method, because by default Ledger is disabled. The reason is
because Ledger support requires to enable CGO, which because of OS
dependencies, breaks the ability to have reproducible builds.

To compile a binary with Ledger support, run:

```
make build-ledger    # build the binary inside the ./build directory
```

### 2. Add your Ledger account to `atomoned`’s keyring

This section must be completed from the **offline computer**.

Connect your Ledger hardware wallet to your computer and open the **Cosmos** app.

Then type in your terminal:

```bash
atomoned keys add <ACCT_NAME> --ledger
```

replacing `<ACCT_NAME>` with the name you would like to give to the account in
the `atomoned` keyring. You will need to confirm the operation on your Ledger
device to allow `atomoned` to read your _public key_.

Should you need to access more options like a different HD derivation path (for
example available as `--hd-path <custom-path>`) you can access the whole list
of options by typing in the command line:

```bash
atomoned keys add -h
```

### 2.a. Import your private key from `gaiad`'s keyring [alternative] [NOT RECOMMENDED]

This section must be completed from the **offline computer**.

The section assumes that your private key is already stored in the `gaiad`'s
keyring. It provides details on how to import it into the `atomoned`'s keyring.

> [!WARNING]
> We do not advise this method, and recommend extreme care because it will
> briefly make your private key readable to your operating system while you are
> copying it. **We always recommend using an hardware wallet instead.** Please
> refer to the dedicated section for instructions on how to add your Ledger
> account to `atomoned`’s keyring.

> [!NOTE]
> Using your mnemonic phrase with `atomoned keys add <ACCT_NAME> --recover` is
> also a potential way of adding your account to `atomoned`'s keyring. However
> be very careful as this is **heavily discouraged** as a method, since it will
> lead you to manually typing your mnemonic which is **potentially vulnerable**
> to being sniffed!

First, you need to export your private key from Gaia. Run the following
command, with `ACCT_NAME` as the name of your account:

```bash
gaiad keys export <ACCT_NAME> 2>&1 | tee key.info
```

Now you can import it in `atomoned`'s keyring:

```bash
atomoned keys import <ACCT_NAME> key.info
```

We recommend immediately deleting that file once the import is complete:

```bash
file=</path/to/your/key.info> && size=$(cat "$file" | wc -c) && \
   dd if=/dev/zero of="$file" bs=$size count=1 && \
   truncate -s 0 "$file" && rm "$file"
```

The command above will also take care of more deeply removing the file from the
file system, for added security. Be sure to replace the
`</path/to/your/key.info>` with the actual path to the `key.info` file you
created previously.

## Submitting a Transaction

### 1. Get account address [offline computer]

From the **offline computer**, where your account data is stored, run the
following command, replacing `<ACCT_NAME>` with the name of your account:

```bash
atomoned keys show <ACCT_NAME>
```

```bash
- address: atone1egswxk2nz4lyjleajdyaqmd08xgy8wsyvdkztp
  name: <ACCT_NAME>
  pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"AiKNFwiX73eaS4vcr1oAaNRIqFC9X3KqvPsenwhsDa0z"}'
  type: local
```

Copy the `address` field and keep it handy. It will be used to identify you as
the author of the transaction. In the following sections of this guide, it will
be referred to as `ADDRESS`.

> [!TIP]
> If you don’t remember the name of your account, you can display all the keys
> by running `atomoned keys list`.

### 2. Get account and sequence number [online computer]

This must be fetched from the **online computer**, because the information is
stored on the blockchain. Run the following command, replacing `<ADDRESS>` with
the address of your account as collected during step 2:

```bash
atomoned query auth account <ADDRESS> --node https://atomone-rpc.allinbits.com:443
```

```bash
'@type': /cosmos.auth.v1beta1.BaseAccount
account_number: "93767"
address: <ADDRESS>
pub_key:
  '@type': /cosmos.crypto.secp256k1.PubKey
  key: AoJlnNcdiaLoPQzAdl5jexafkQ/AKoLe5YG58fsYF4ZX
sequence: "3"
```

Copy the `account_number` and `sequence` field somewhere, they will be referred
to as `ACCOUNT_NUMER` and `SEQUENCE_NUMBER` in the following sections.

If you can’t find the address by querying the blockchain, it means the account
does not exist and hence its account sequence will be 0, and account number
will be unspecified. However, keep in mind that accounts that do not exist are
not able to submit transactions either on AtomOne as well as in most other live
blockchains. Generally, you would be able to create a new account by adding to
it some balance.

### 3. Create the transaction

You can create the transaction from either the **online** or the **offline
computers**, with the caveat that you will have to safely copy the unsigned
transaction over the offline computer for signing in case you used the online
computer to generate it. You can generate all types of transactions using the
CLI. The command is as follows:

You can generate all types of transactions using the CLI. The command is as
follows:

```bash
atomoned tx <MODULE> <TRANSACTION> [FLAGS]
   --from <ADDRESS> \
   --chain-id atomone-1 \
   --fees 5000uatone \
   --generate-only \
   --sequence <SEQUENCE_NUMBER> \
   > tx.unsigned.json
```

Here, `MODULE` refers to the Cosmos SDK module name, and `TRANSACTION` is the
transaction name in kebab-case. To list all available transactions of a module,
use `atomoned tx <MODULE>`.

> [!TIP]
> You can get a list of all available modules by typing `atomoned tx -h` in your
> terminal.

For instance, with the `staking` module, the following transactions are
available:

```bash
atomoned tx staking
```

```bash
Staking transaction subcommands

Usage:
  atomoned tx staking [flags]
  atomoned tx staking [command]

Available Commands:
  cancel-unbond    Cancel unbonding delegation and delegate back to the validator
  create-validator create new validator initialized with a self-delegation to it
  delegate         Delegate liquid tokens to a validator
  edit-validator   edit an existing validator account
  redelegate       Redelegate illiquid tokens from one validator to another
  unbond           Unbond shares from a validator
```

To specifically delegate to a validator, run the following command:

```bash
atomoned tx staking delegate <VALIDATOR_ADDRESS> <AMOUNT>\
   --from <ADDRESS> \
   --chain-id atomone-1 \
   --fees 5000uatone \
   --generate-only \
   --sequence <SEQUENCE_NUMBER> \
   > tx.unsigned.json
```

Where <VALIDATOR_ADDRESS> is the address of the validator you wish to delegate
to. The prefix must be `atonevaloper`, you can query the addresses of all
active validators from the **online computer** using the following command:

```sh
atomoned query staking validators --node https://atomone-rpc.allinbits.com:443
```

The command will generate a `tx.unsigned.json` file in the current directory,
which contains the necessary information to delegate to a validator. Please
note that you might be required to adjust the fees for your transaction to be
successfully accepted and included in a block.

### 4. Sign the transaction [offline computer]

From the **offline computer**, we will now sign the transaction, using the
`tx.unsigned.json` file generated at the previous step. Run the following
command:

```bash
atomoned tx sign tx.unsigned.json \
   --offline \
   --from <ACCT_NAME> \
   --account-number <ACCOUNT_NUMBER> \
   --sequence <SEQUENCE_NUMBER> \
   --chain-id atomone-1 \
   --output-document tx.signed.json
```

This will generate a `tx.signed.json` file in the current directory, which
contains the final signed transaction.

Remember to have the Ledger connected and the Cosmos app open before hitting
enter because the signing will have to be performed on the Ledger and you will
have to confirm the signing request on the device.

Notice that in case needed the `--ledger` flag can also be added to the above
command to force attempting connection to a Ledger device to request signature.
However, if you added the account to the keyring already using `--ledger`, this
flag for the `sign` command should not be necessary.

You can then securely transfer this file to the **online computer**.

### 5. Broadcast the transaction [online computer]

From the **online computer**, run the following command:

```bash
atomoned tx broadcast tx.signed.json --node https://atomone-rpc.allinbits.com:443
```

```bash
code: 0
codespace: ""
data: ""
events: []
gas_used: "0"
gas_wanted: "0"
height: "0"
info: ""
logs: []
raw_log: '[]'
timestamp: ""
tx: null
txhash: D8681EFF99C0B93BA87972B57E18B3D6D3260C84C04E8BFC09877D7F19520833
```

If the `code` field is 0, then congratulations 🎉, your transaction has been
successfully accepted and is being gossiped by validators for potential
inclusion in the coming blocks.

This means you should be able to see your transaction included in a block
shortly after. You should be able to view your delegation in the list by
executing the following command:

```bash
atomoned query staking delegations <ADDRESS> --node https://atomone-rpc.allinbits.com:443
```

You can also check your transaction status by running:

```bash
atomoned query tx <TX_HASH>
```

Where `TX_HASH` comes from the `txhash` field returned by the `tx broadcast`
command just above.

Should the command return an error instead (for example insufficient fees), the
error should be self explanatory and help you understand what need to be fixed
in order to get your transaction to be successfully broadcasted and eventually
included in a block. If the error is instead caused by some state-dependent
check, you will have to check the blockchain for your `TX_HASH` to see what
went wrong as explained above.

## Conclusions

This guide demonstrated how to securely delegate to a validator to AtomOne
using the CLI. However, its application isn't limited to this alone. It can be
used for all types of transactions and can also be employed as a general
guideline on how to submit transactions to virtually any Cosmos-SDK blockchain.

To submit another type of transaction, modify the command in Section 3. If
you're submitting to another Cosmos-SDK blockchain, simply switch to the
appropriate binary.

While the [official Cosmos SDK
documentation](https://docs.cosmos.network/v0.46/run-node/txs.html) also
explains this, this guide addresses additional security concerns. Notably, it
covers issues related to private key management and transaction signing, adding
an additional layer of security by only performing the signing using an offline
computer.

[v1.0.0]: https://github.com/atomone-hub/atomone/releases/tag/v1.0.0
