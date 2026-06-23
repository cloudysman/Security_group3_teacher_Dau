# Blockchain technology and applications

Course project for **Advanced Information Security**. The project studies
blockchain technology from a security viewpoint and implements a practical
experiment: a blockchain-based supply chain tracking system running on a local
Ethereum blockchain.

- **Lecturer:** Assoc. Prof. Dr. Hoang Xuan Dau
- **Group:** 3 — student ID M25VMCS12
- **Topic:** blockchain technology, blockchain platforms, and a working experiment

## Repository contents

| Item | Description |
|------|-------------|
| `Topic Security.updated.docx` | The final report (recommended version). |
| `Topic Security.pdf` | The report in PDF. |
| `Topic Security - Slides.pptx` | The presentation slides. |
| `supply-chain-demo/` | The experiment: smart contract, scripts, tests and web interface. |

## The experiment

A supply chain tracking system that records product creation, status changes
and integrity verification on a local Ethereum blockchain. It demonstrates the
main security properties discussed in the report:

- **Data integrity and tamper detection** — each product stores a hash; changing the data is detected.
- **Authentication** — every action is a signed transaction.
- **Access control** — only authorized participants can change product data.
- **Auditability** — every action is recorded with a transaction hash and block number.

**Technology:** Solidity, Hardhat, Ethers.js and React.

## How to run the experiment

```bash
cd supply-chain-demo
npm install
cd frontend && npm install && cd ..

# terminal 1: start the local Ethereum blockchain
npx hardhat node

# terminal 2: deploy the smart contract
npx hardhat run scripts/deploy.js --network localhost

# terminal 3: start the web interface (http://localhost:5173)
cd frontend && npm run dev
```

To run the unit tests: `npx hardhat test`.
Full details are in [`supply-chain-demo/README.md`](supply-chain-demo/README.md).
