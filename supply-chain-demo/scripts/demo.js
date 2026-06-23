// End-to-end demo scenario executed against the local Ethereum network.
// It plays the full supply-chain flow and prints real transaction hashes,
// block numbers and verification results that can be pasted into the report
// (sections 6.7 Demo Procedure and 6.8 Demo Results).
const hre = require("hardhat");

const STATUS = ["Created", "Shipped", "Received", "Sold"];

function line() {
  console.log("-".repeat(72));
}

async function logTx(label, txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  console.log(`${label}`);
  console.log(`   tx hash     : ${receipt.hash}`);
  console.log(`   block number: ${receipt.blockNumber}`);
  console.log(`   from        : ${tx.from}`);
  console.log(`   gas used    : ${receipt.gasUsed.toString()}`);
  return receipt;
}

async function main() {
  const [manufacturer, distributor, retailer, customer] =
    await hre.ethers.getSigners();

  line();
  console.log("BLOCKCHAIN-BASED SUPPLY CHAIN TRACKING SYSTEM - DEMO RUN");
  line();
  console.log("Manufacturer (owner):", manufacturer.address);
  console.log("Distributor         :", distributor.address);
  console.log("Retailer            :", retailer.address);
  console.log("Customer            :", customer.address);
  line();

  // 1. Deploy
  const Tracker = await hre.ethers.getContractFactory("SupplyChainTracker");
  const tracker = await Tracker.deploy();
  await tracker.waitForDeployment();
  console.log("Contract deployed at:", await tracker.getAddress());
  line();

  // 2. Owner authorizes participants (access control)
  console.log("STEP 1 - Owner authorizes participants");
  await logTx("Authorize distributor",
    tracker.authorizeParticipant(distributor.address));
  await logTx("Authorize retailer",
    tracker.authorizeParticipant(retailer.address));
  line();

  // 3. Manufacturer creates a product
  console.log("STEP 2 - Manufacturer creates a product");
  const name = "Vaccine Batch A";
  const origin = "Hanoi Factory";
  const serial = "SN-2026-0001";
  await logTx(`Create product ("${name}", origin "${origin}", serial "${serial}")`,
    tracker.connect(manufacturer).createProduct(name, origin, serial));

  const id = await tracker.productCount();
  const product = await tracker.getProduct(id);
  console.log(`   product id  : ${id}`);
  console.log(`   stored hash : ${product[3]}`);
  console.log(`   status      : ${STATUS[Number(product[4])]}`);
  line();

  // 4. Status updates by different signers
  console.log("STEP 3 - Status updates (signed by different participants)");
  await logTx("Distributor -> Shipped",
    tracker.connect(distributor).updateStatus(id, 1, "Shipped from warehouse"));
  await logTx("Retailer -> Received",
    tracker.connect(retailer).updateStatus(id, 2, "Received at store"));
  await logTx("Manufacturer -> Sold",
    tracker.connect(manufacturer).updateStatus(id, 3, "Sold to customer"));
  line();

  // 5. Access control failure (unauthorized account)
  console.log("STEP 4 - Access control: unauthorized account is rejected");
  try {
    await tracker.connect(customer).updateStatus(id, 3, "Hacker tries to edit");
    console.log("   ERROR: unauthorized update unexpectedly succeeded!");
  } catch (e) {
    const reason = e.reason || (e.shortMessage ?? e.message);
    console.log(`   Rejected as expected -> "${reason}"`);
  }
  line();

  // 6. Verification: genuine vs tampered data
  console.log("STEP 5 - Customer verifies product integrity");
  const genuine = await tracker.verifyProduct(id, name, origin, serial);
  console.log(`   Verify with ORIGINAL data  -> ${genuine}  (expected true)`);

  const tampered = await tracker.verifyProduct(
    id, "Vaccine Batch A", origin, "SN-2026-9999"); // serial altered
  console.log(`   Verify with TAMPERED serial -> ${tampered}  (expected false)`);
  line();

  // 7. Full audit trail
  console.log("STEP 6 - Audit trail / product history");
  const len = await tracker.getHistoryLength(id);
  for (let i = 0; i < Number(len); i++) {
    const [status, updatedBy, ts, note] = await tracker.getHistoryRecord(id, i);
    const time = new Date(Number(ts) * 1000).toISOString();
    console.log(
      `   #${i}  ${STATUS[Number(status)].padEnd(9)} by ${updatedBy}  @${time}  "${note}"`
    );
  }
  line();
  console.log("DEMO COMPLETE.");
  line();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
