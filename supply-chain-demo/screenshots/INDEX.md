# Screenshots — where each one goes in the report

| File | Report section | What it shows |
|------|----------------|---------------|
| `terminal-node-deploy.png` | 6.6 Installation and Configuration | Local Ethereum node accounts + contract deployment output |
| `01-overview.png` | 6.4 / 6.6 (optional) | The web interface layout (roles, panels, connection status) |
| `02-product-created.png` | 6.7 Demo Procedure | Product created on-chain, showing the stored product hash |
| `03-access-control-rejected.png` | 6.7 / 6.9 (Access Control) | Customer (unauthorized) is rejected: "Not an authorized participant" |
| `04-verify-authentic.png` | 6.7 / 6.9 (Data Integrity) | Verifying original data → AUTHENTIC (hash matches) |
| `05-verify-tampered.png` | 6.7 / 6.9 (Tamper Detection) | Verifying modified serial → TAMPERED (hash mismatch) |
| `06-product-history.png` | 6.8 Demo Results | Full product audit trail (Created → Shipped → Received → Sold) |
| `07-transaction-log.png` | 6.8 Demo Results | Transaction hashes + block numbers of every operation |
| `terminal-demo-cli.png` | 6.8 Demo Results | CLI run of `scripts/demo.js` — all results in one view |
| `terminal-tests.png` | 6.8 Demo Results | Unit tests passing (7/7) |

All images were captured from a real run on the local Hardhat Ethereum network.
The transaction hashes in `terminal-demo-cli.png` match Table 9 in the
ready-to-paste text (`REPORT-SECTIONS.md`).
