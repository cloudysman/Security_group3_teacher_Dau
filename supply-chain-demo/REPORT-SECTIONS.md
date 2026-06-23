# Ready-to-paste content for the report (Sections 6.6, 6.7, 6.8)

The text below is written to match the style of your report. Replace the
bracketed `[Screenshot: …]` placeholders with screenshots you capture while
running the demo. The transaction hashes and addresses below are from a real
run on the local Hardhat network — re-run `scripts/demo.js` to regenerate them
if you want your own values.

---

## 6.6. Installation and Configuration

The demo was implemented and tested on Windows with Node.js v22 and npm. The
project is divided into two parts: a Hardhat project that contains the smart
contract and a React (Vite) frontend that interacts with it through Ethers.js.

**Step 1 — Install the development tools.**
The Hardhat development environment and its toolbox were installed in the
project root:

```bash
cd supply-chain-demo
npm install            # installs hardhat + @nomicfoundation/hardhat-toolbox
cd frontend
npm install            # installs react, react-dom, ethers, vite
```

**Step 2 — Configure the Solidity compiler and the local network.**
The file `hardhat.config.js` sets the Solidity version to 0.8.24 (with the
optimizer enabled) and registers the local network endpoint:

```js
module.exports = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: { localhost: { url: "http://127.0.0.1:8545" } },
};
```

**Step 3 — Compile the smart contract.**

```bash
npx hardhat compile
```
Output: `Compiled 1 Solidity file successfully (evm target: paris).`

**Step 4 — Start the local Ethereum blockchain.**

```bash
npx hardhat node
```
This starts a local Ethereum network at `http://127.0.0.1:8545` and provides 20
pre-funded test accounts. The first four accounts are used in the demo as the
Manufacturer (owner), Distributor, Retailer and Customer.

**Step 5 — Deploy the smart contract.**

```bash
npx hardhat run scripts/deploy.js --network localhost
```
The deployment script deploys `SupplyChainTracker`, makes the deployer the owner,
authorizes the Distributor and Retailer accounts, and writes the deployed
address and ABI to `frontend/src/contract/deployment.json` so the frontend can
connect automatically.

Deployment output:
```
SupplyChainTracker deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Owner (Manufacturer): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Authorized Distributor: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Authorized Retailer:    0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

**Step 6 — Start the web interface.**

```bash
cd frontend
npm run dev
```
The application is served at `http://localhost:5173` and connects to the local
blockchain through Ethers.js.

**→ Insert screenshot `screenshots/terminal-node-deploy.png`** (local node account
list + contract deployment output).

---

## 6.7. Demo Procedure

The demo follows the supply-chain scenario in Figure 2
(Manufacturer → Distributor → Retailer → Customer). All actions are performed
through the web interface; each action that changes data is sent to the
blockchain as a signed transaction.

1. **Select a role.** The interface lets the user act as the Manufacturer,
   Distributor, Retailer or Customer. Each role corresponds to a different
   Ethereum account, so transactions are signed by different private keys.

2. **Create a product (Manufacturer).** In the *Create product* panel the
   Manufacturer enters the product name (`Vaccine Batch A`), origin
   (`Hanoi Factory`) and serial number (`SN-2026-0001`) and clicks
   *Create on blockchain*. The smart contract computes the product hash
   `keccak256(name, serial, origin)`, stores the product with status `Created`,
   and records the first history entry.

3. **Ship the product (Distributor).** Acting as the Distributor, the user loads
   product #1 and clicks *Advance to next status*. The status changes from
   `Created` to `Shipped`.

4. **Receive the product (Retailer).** Acting as the Retailer, the status is
   advanced from `Shipped` to `Received`.

5. **Mark as sold.** The status is advanced from `Received` to `Sold`, which is
   the final state.

6. **Attempt an unauthorized update (negative test).** Acting as the Customer
   (an account that was never authorized), the user tries to change the status.
   The transaction is rejected by the smart contract with the message
   *"Not an authorized participant"*, demonstrating access control.

7. **Verify product integrity (Customer).** In the *Verify integrity* panel the
   user first enters the original product information; the contract returns
   `true` (authentic). The user then enters a modified serial number
   (`SN-2026-9999`); the contract returns `false`, demonstrating tamper
   detection.

8. **Review the audit trail.** The *Product* panel shows the complete history of
   the product, and the *Transaction log* shows the transaction hash and block
   number of every operation.

**→ Insert screenshot `screenshots/02-product-created.png`** (web interface after
creating the product, showing product details and the product hash).
**→ Insert screenshots `screenshots/04-verify-authentic.png` and
`screenshots/05-verify-tampered.png`** (verification panel showing AUTHENTIC for
original data and TAMPERED for the modified serial).
**→ Optionally `screenshots/03-access-control-rejected.png`** (the Customer
account being rejected when it tries to update the status).

---

## 6.8. Demo Results

The scenario was executed successfully on the local Ethereum network. Every
operation produced a transaction that was mined into a block and assigned a
unique transaction hash, confirming that the actions are permanently recorded on
the blockchain.

**Table 9. Transactions produced during the demo run.**

| Step | Action | From (role) | Block | Transaction hash | Gas used |
|------|--------|-------------|-------|------------------|----------|
| 1 | Authorize Distributor | Manufacturer | 2 | 0xf3d776259e076b131ed341e32d6f4ffb23db50e122e27074638c083d93da3e8e | 47,271 |
| 2 | Authorize Retailer | Manufacturer | 3 | 0xa76a0866595ff1365062faf2c5671abbc0fe34996892ba27ee05e20e5d8868c4 | 47,259 |
| 3 | Create product #1 | Manufacturer | 4 | 0x62e2020b01c3c58bf6e7e3336f17732caedbf14664ae98ed42cd894adfe50f6c | 297,540 |
| 4 | Update → Shipped | Distributor | 5 | 0x360bcbaae0299776347c43b744e3e4c13dab4f4fd50bd1a90cf677bb17f80d00 | 107,125 |
| 5 | Update → Received | Retailer | 6 | 0xfdce6267071735dbc5f8c25f3b87fab7f9b1cf79ed267a93c6970f309d3848f8 | 107,065 |
| 6 | Update → Sold | Manufacturer | 7 | 0x93297b86649da21856b428dded56d8a31bad9698a2fc95580875e6e9bddaf6de | 107,053 |

Product #1 was stored with the hash
`0x2bdac562c02ccbcd94e74dd6aa77cdff268749c32105169912659168e4e8a320`.
(Note: the same hash appears in the web interface — see `02-product-created.png`
— because it is computed deterministically from the product fields.)

**Access control result.** When the unauthorized Customer account attempted to
update the status, the transaction was reverted by the contract:
```
Rejected as expected -> "VM Exception while processing transaction:
reverted with reason string 'Not an authorized participant'"
```

**Integrity verification result.**

| Verification input | Result |
|--------------------|--------|
| Original data (name, origin, serial = `SN-2026-0001`) | **true** — authentic |
| Tampered data (serial changed to `SN-2026-9999`) | **false** — tampering detected |

**Audit trail (product history).**

| # | Status | Updated by (role) | Note |
|---|--------|-------------------|------|
| 0 | Created | Manufacturer (0xf39F…2266) | Product created |
| 1 | Shipped | Distributor (0x7099…79C8) | Shipped from warehouse |
| 2 | Received | Retailer (0x3C44…93BC) | Received at store |
| 3 | Sold | Manufacturer (0xf39F…2266) | Sold to customer |

These results show that the system records every supply-chain event as an
immutable, signed and timestamped transaction; that only authorized participants
can modify product data; and that any modification of the product information is
immediately detectable because the recomputed hash no longer matches the hash
stored on the blockchain.

**→ Insert screenshot `screenshots/07-transaction-log.png`** (Transaction log
panel) and **`screenshots/06-product-history.png`** (full audit trail of the
product).
**→ Insert screenshot `screenshots/terminal-demo-cli.png`** (CLI output of
`scripts/demo.js`, which shows all of the results above in one view). The unit
tests in `screenshots/terminal-tests.png` confirm the contract logic.

The unit-test suite also passes (7/7), confirming the contract logic:
```
npx hardhat test
  SupplyChainTracker
    ✔ sets the deployer as owner and authorizes it
    ✔ creates a product and stores a hash
    ✔ blocks unauthorized accounts from creating products (access control)
    ✔ advances status only in the correct order
    ✔ rejects skipping a status (business rule on-chain)
    ✔ verifies genuine data as true and tampered data as false
    ✔ records an append-only history
  7 passing
```
