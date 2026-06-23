// Roles mapped to the default Hardhat development accounts.
//
// WARNING: These private keys are the well-known, publicly documented Hardhat
// test keys (mnemonic "test test test ... junk"). They are ONLY funded on a
// local development network and must NEVER be used on a real network or to
// hold real funds. They are embedded here only to make the local classroom
// demo work without wallet setup.
export const RPC_URL = "http://127.0.0.1:8545";

export const ROLES = [
  {
    name: "Manufacturer (Owner)",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  {
    name: "Distributor",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
  {
    name: "Retailer",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey:
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  },
  {
    name: "Customer",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    privateKey:
      "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  },
];

export const STATUS_LABELS = ["Created", "Shipped", "Received", "Sold"];
