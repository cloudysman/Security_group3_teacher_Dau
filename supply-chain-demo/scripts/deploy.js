// Deploys SupplyChainTracker to the local Hardhat network, authorizes the
// distributor and retailer accounts, and writes the contract address + ABI to
// the React frontend so it can connect automatically.
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [owner, distributor, retailer] = await hre.ethers.getSigners();

  const Tracker = await hre.ethers.getContractFactory("SupplyChainTracker");
  const tracker = await Tracker.deploy();
  await tracker.waitForDeployment();
  const address = await tracker.getAddress();

  console.log("SupplyChainTracker deployed to:", address);
  console.log("Owner (Manufacturer):", owner.address);

  // Owner authorizes the other supply-chain participants.
  await (await tracker.authorizeParticipant(distributor.address)).wait();
  await (await tracker.authorizeParticipant(retailer.address)).wait();
  console.log("Authorized Distributor:", distributor.address);
  console.log("Authorized Retailer:   ", retailer.address);

  // Export address + ABI for the frontend.
  const artifact = hre.artifacts.readArtifactSync("SupplyChainTracker");
  const outDir = path.join(__dirname, "..", "frontend", "src", "contract");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "deployment.json"),
    JSON.stringify({ address, abi: artifact.abi }, null, 2)
  );
  console.log("\nFrontend config written to frontend/src/contract/deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
