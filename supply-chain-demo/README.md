# Blockchain-Based Supply Chain Tracking System (Demo)

Practical experiment for the **Advanced Information Security** report
(Topic: *Blockchain Technology and Applications*, Section 6).

It implements the `SupplyChainTracker` smart contract described in the report and
a React frontend, running on a **local Ethereum blockchain** (Hardhat) at
`http://127.0.0.1:8545`.

## Security properties demonstrated
| Property | Where |
|----------|-------|
| Data integrity & tamper detection | `verifyProduct()` recomputes keccak256 hash and compares |
| Authentication | every state-changing call is a signed transaction (`msg.sender`) |
| Access control | `onlyOwner` / `onlyAuthorized` modifiers |
| Auditability & traceability | append-only `history[]` + emitted events |
| Business-rule enforcement | status can only move Created → Shipped → Received → Sold |

## Project structure
```
supply-chain-demo/
├─ contracts/SupplyChainTracker.sol   # the smart contract
├─ scripts/deploy.js                  # deploy + export ABI/address to frontend
├─ scripts/demo.js                    # CLI end-to-end scenario (prints results)
├─ test/SupplyChainTracker.test.js    # 7 unit tests
├─ hardhat.config.js
└─ frontend/                          # React + Vite + ethers.js UI
   └─ src/{App.jsx, roles.js, contract/deployment.json}
```

## Requirements
- Node.js 18+ (tested on v22)
- npm

## How to run (4 terminals concept, but really 3 steps)

### 1. Install dependencies
```bash
cd supply-chain-demo
npm install
cd frontend && npm install && cd ..
```

### 2. Start the local Ethereum blockchain  (keep this terminal open)
```bash
npx hardhat node
```
This launches a local network on `http://127.0.0.1:8545` with 20 funded test
accounts.

### 3. Deploy the contract (new terminal)
```bash
npx hardhat run scripts/deploy.js --network localhost
```
The deployer (Account #0) becomes owner and authorizes the Distributor and
Retailer accounts. The contract address + ABI are written to
`frontend/src/contract/deployment.json`.

### 4a. Run the GUI demo (new terminal)
```bash
cd frontend
npm run dev
```
Open <http://localhost:5173>. Pick a role (Manufacturer / Distributor /
Retailer / Customer) and create a product, advance its status, and verify it.

### 4b. Or run the CLI scenario (prints tx hashes / results for the report)
```bash
npx hardhat run scripts/demo.js --network localhost
```

## Run the unit tests
```bash
npx hardhat test
```

> **Security note:** the private keys in `frontend/src/roles.js` are the public,
> well-known Hardhat development keys. They are funded only on the local network
> and must NEVER be used on a real network or to hold real funds.
