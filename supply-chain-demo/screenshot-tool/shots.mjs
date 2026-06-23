import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "screenshots");
const CAP = path.join(__dirname, "captures");
const URL = "http://localhost:5173";

fs.mkdirSync(OUT, { recursive: true });

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const readCap = (name) => {
  try {
    return stripAnsi(fs.readFileSync(path.join(CAP, name), "utf8")).trimEnd();
  } catch {
    return `(missing ${name})`;
  }
};

async function shot(page, name) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: true });
  console.log("saved", name);
}

async function renderTerminal(page, title, body, name) {
  const html = `<!doctype html><html><body style="margin:0;background:#0c0c0c;">
  <div style="font:13px/1.55 Consolas,'Courier New',monospace;color:#dcdcdc;padding:18px 20px;white-space:pre-wrap;word-break:break-word;">
  <div style="color:#4ec9b0;font-weight:bold;margin-bottom:10px;">${escapeHtml(title)}</div>${escapeHtml(body)}</div>
  </body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
  console.log("saved", name);
}

const sleep = (page, ms) => page.waitForTimeout(ms);

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  // ---- 1. Render terminal screenshots from captured text ----
  await renderTerminal(
    page,
    "Terminal 1 - Local Ethereum node (npx hardhat node) + contract deployment",
    readCap("node.txt") + "\n\n" + readCap("deploy.txt"),
    "terminal-node-deploy.png"
  );
  await renderTerminal(
    page,
    "Terminal - End-to-end CLI scenario (npx hardhat run scripts/demo.js)",
    readCap("demo.txt"),
    "terminal-demo-cli.png"
  );
  await renderTerminal(
    page,
    "Terminal - Unit tests (npx hardhat test)",
    readCap("test.txt"),
    "terminal-tests.png"
  );

  // ---- 2. Drive the web UI ----
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator(".dot.ok").waitFor({ timeout: 20000 });
  await sleep(page, 800);
  await shot(page, "01-overview.png");

  const createCard = page.locator("section.card").filter({ hasText: "1. Create product" });
  const updateCard = page.locator("section.card").filter({ hasText: "2. Load / update status" });
  const verifyCard = page.locator("section.card").filter({ hasText: "3. Verify integrity" });
  const roleBtn = (name) => page.getByRole("button", { name, exact: true });

  // Manufacturer creates a product
  await createCard.getByPlaceholder("Product name").fill("Vaccine Batch A");
  await createCard.getByPlaceholder("Origin").fill("Hanoi Factory");
  await createCard.getByPlaceholder("Serial number").fill("SN-2026-0001");
  await createCard.getByRole("button", { name: "Create on blockchain" }).click();
  await page.getByRole("heading", { name: /Product #1/ }).waitFor({ timeout: 15000 });
  await sleep(page, 800);
  await shot(page, "02-product-created.png");

  // Distributor -> Shipped
  await roleBtn("Distributor").click();
  await sleep(page, 400);
  await updateCard.getByRole("button", { name: "Load product" }).click();
  await sleep(page, 800);
  await updateCard.getByRole("button", { name: "Advance to next status" }).click();
  await sleep(page, 1500);

  // Retailer -> Received
  await roleBtn("Retailer").click();
  await sleep(page, 400);
  await updateCard.getByRole("button", { name: "Load product" }).click();
  await sleep(page, 800);
  await updateCard.getByRole("button", { name: "Advance to next status" }).click();
  await sleep(page, 1500);

  // Customer tries to advance -> rejected (access control)
  await roleBtn("Customer").click();
  await sleep(page, 400);
  await updateCard.getByRole("button", { name: "Load product" }).click();
  await sleep(page, 800);
  await updateCard.getByRole("button", { name: "Advance to next status" }).click();
  await sleep(page, 1500);
  await shot(page, "03-access-control-rejected.png");

  // Manufacturer -> Sold (final)
  await roleBtn("Manufacturer (Owner)").click();
  await sleep(page, 400);
  await updateCard.getByRole("button", { name: "Load product" }).click();
  await sleep(page, 800);
  await updateCard.getByRole("button", { name: "Advance to next status" }).click();
  await sleep(page, 1500);

  // Customer verifies genuine data -> AUTHENTIC
  await roleBtn("Customer").click();
  await sleep(page, 400);
  await updateCard.getByRole("button", { name: "Load product" }).click();
  await sleep(page, 800);
  await verifyCard.getByPlaceholder("Product name").fill("Vaccine Batch A");
  await verifyCard.getByPlaceholder("Origin").fill("Hanoi Factory");
  await verifyCard.getByPlaceholder("Serial number").fill("SN-2026-0001");
  await verifyCard.getByRole("button", { name: "Verify product" }).click();
  await page.locator(".verify.ok").waitFor({ timeout: 10000 });
  await sleep(page, 600);
  await shot(page, "04-verify-authentic.png");

  // Customer verifies tampered data -> TAMPERED
  await verifyCard.getByPlaceholder("Serial number").fill("SN-2026-9999");
  await verifyCard.getByRole("button", { name: "Verify product" }).click();
  await page.locator(".verify.bad").waitFor({ timeout: 10000 });
  await sleep(page, 600);
  await shot(page, "05-verify-tampered.png");

  // Focused element screenshots: product card (full history) + transaction log
  await sleep(page, 500);
  const productCard = page.locator("section.card").filter({ hasText: "Product #1" });
  await productCard.screenshot({ path: path.join(OUT, "06-product-history.png") });
  console.log("saved", "06-product-history.png");

  const logCard = page.locator("section.card").filter({ hasText: "Transaction log" });
  await logCard.screenshot({ path: path.join(OUT, "07-transaction-log.png") });
  console.log("saved", "07-transaction-log.png");

  await browser.close();
  console.log("\nAll screenshots written to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
