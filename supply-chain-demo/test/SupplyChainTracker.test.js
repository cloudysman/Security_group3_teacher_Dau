const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChainTracker", function () {
  let tracker, owner, distributor, retailer, attacker;

  beforeEach(async function () {
    [owner, distributor, retailer, attacker] = await ethers.getSigners();
    const Tracker = await ethers.getContractFactory("SupplyChainTracker");
    tracker = await Tracker.deploy();
    await tracker.waitForDeployment();
    await tracker.authorizeParticipant(distributor.address);
    await tracker.authorizeParticipant(retailer.address);
  });

  it("sets the deployer as owner and authorizes it", async function () {
    expect(await tracker.owner()).to.equal(owner.address);
    expect(await tracker.authorized(owner.address)).to.equal(true);
  });

  it("creates a product and stores a hash", async function () {
    await tracker.createProduct("Vaccine A", "Hanoi", "SN-1");
    const id = await tracker.productCount();
    const p = await tracker.getProduct(id);
    expect(p[1]).to.equal("Vaccine A");
    expect(p[4]).to.equal(0n); // Status.Created
    const expected = ethers.solidityPackedKeccak256(
      ["string", "string", "string"],
      ["Vaccine A", "SN-1", "Hanoi"]
    );
    expect(p[3]).to.equal(expected);
  });

  it("blocks unauthorized accounts from creating products (access control)", async function () {
    await expect(
      tracker.connect(attacker).createProduct("Fake", "X", "SN-9")
    ).to.be.revertedWith("Not an authorized participant");
  });

  it("advances status only in the correct order", async function () {
    await tracker.createProduct("Vaccine A", "Hanoi", "SN-1");
    const id = await tracker.productCount();
    await tracker.connect(distributor).updateStatus(id, 1, "shipped");
    await tracker.connect(retailer).updateStatus(id, 2, "received");
    const p = await tracker.getProduct(id);
    expect(p[4]).to.equal(2n); // Received
  });

  it("rejects skipping a status (business rule on-chain)", async function () {
    await tracker.createProduct("Vaccine A", "Hanoi", "SN-1");
    const id = await tracker.productCount();
    await expect(
      tracker.connect(distributor).updateStatus(id, 2, "skip")
    ).to.be.revertedWith("Invalid status transition");
  });

  it("verifies genuine data as true and tampered data as false", async function () {
    await tracker.createProduct("Vaccine A", "Hanoi", "SN-1");
    const id = await tracker.productCount();
    expect(await tracker.verifyProduct(id, "Vaccine A", "Hanoi", "SN-1")).to.equal(true);
    expect(await tracker.verifyProduct(id, "Vaccine A", "Hanoi", "SN-999")).to.equal(false);
  });

  it("records an append-only history", async function () {
    await tracker.createProduct("Vaccine A", "Hanoi", "SN-1");
    const id = await tracker.productCount();
    await tracker.connect(distributor).updateStatus(id, 1, "shipped");
    expect(await tracker.getHistoryLength(id)).to.equal(2n);
    const rec = await tracker.getHistoryRecord(id, 1);
    expect(rec[0]).to.equal(1n); // Shipped
    expect(rec[1]).to.equal(distributor.address);
  });
});
