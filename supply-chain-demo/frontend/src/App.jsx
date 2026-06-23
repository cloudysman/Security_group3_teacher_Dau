import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import deployment from "./contract/deployment.json";
import { RPC_URL, ROLES, STATUS_LABELS } from "./roles";

const provider = new ethers.JsonRpcProvider(RPC_URL);

export default function App() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [blockNumber, setBlockNumber] = useState(null);
  const [connected, setConnected] = useState(false);

  // Forms
  const [form, setForm] = useState({ name: "", origin: "", serial: "" });
  const [productId, setProductId] = useState("1");
  const [note, setNote] = useState("");
  const [verifyForm, setVerifyForm] = useState({ name: "", origin: "", serial: "" });

  // Data
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [verifyResult, setVerifyResult] = useState(null);
  const [txLog, setTxLog] = useState([]);
  const [message, setMessage] = useState("");

  const role = ROLES[roleIndex];

  // A contract instance signed by the currently selected role.
  const contract = useMemo(() => {
    const wallet = new ethers.Wallet(role.privateKey, provider);
    return new ethers.Contract(deployment.address, deployment.abi, wallet);
  }, [roleIndex]);

  // Poll chain info.
  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const bn = await provider.getBlockNumber();
        if (alive) {
          setBlockNumber(bn);
          setConnected(true);
        }
      } catch {
        if (alive) setConnected(false);
      }
    }
    tick();
    const t = setInterval(tick, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  function pushLog(action, receipt) {
    setTxLog((log) => [
      {
        action,
        hash: receipt.hash,
        block: receipt.blockNumber,
        from: receipt.from,
      },
      ...log,
    ]);
  }

  async function handleError(e, fallback) {
    const reason = e?.reason || e?.shortMessage || e?.message || fallback;
    setMessage(`❌ ${reason}`);
  }

  async function createProduct() {
    setMessage("Sending transaction...");
    try {
      const tx = await contract.createProduct(form.name, form.origin, form.serial);
      const receipt = await tx.wait();
      pushLog(`createProduct("${form.name}")`, receipt);
      const newId = await contract.productCount();
      setProductId(newId.toString());
      setMessage(`✅ Product #${newId} created. tx ${receipt.hash}`);
      await loadProduct(newId.toString());
    } catch (e) {
      handleError(e, "createProduct failed");
    }
  }

  async function authorizeSelf(addr) {
    setMessage("Authorizing participant...");
    try {
      const tx = await contract.authorizeParticipant(addr);
      const receipt = await tx.wait();
      pushLog(`authorizeParticipant(${addr.slice(0, 10)}...)`, receipt);
      setMessage(`✅ Authorized ${addr}`);
    } catch (e) {
      handleError(e, "authorize failed");
    }
  }

  async function updateStatus() {
    if (!product) return setMessage("❌ Load a product first");
    const next = product.statusIndex + 1;
    if (next > 3) return setMessage("❌ Product already Sold (final status)");
    setMessage("Sending transaction...");
    try {
      const tx = await contract.updateStatus(productId, next, note || STATUS_LABELS[next]);
      const receipt = await tx.wait();
      pushLog(`updateStatus(#${productId} -> ${STATUS_LABELS[next]})`, receipt);
      setMessage(`✅ Status -> ${STATUS_LABELS[next]}. tx ${receipt.hash}`);
      setNote("");
      await loadProduct(productId);
    } catch (e) {
      handleError(e, "updateStatus failed");
    }
  }

  async function loadProduct(id) {
    try {
      const p = await contract.getProduct(id);
      const loaded = {
        id: p[0].toString(),
        name: p[1],
        origin: p[2],
        hash: p[3],
        statusIndex: Number(p[4]),
        handler: p[5],
        createdAt: new Date(Number(p[6]) * 1000).toLocaleString(),
      };
      setProduct(loaded);
      const len = Number(await contract.getHistoryLength(id));
      const recs = [];
      for (let i = 0; i < len; i++) {
        const r = await contract.getHistoryRecord(id, i);
        recs.push({
          status: STATUS_LABELS[Number(r[0])],
          updatedBy: r[1],
          timestamp: new Date(Number(r[2]) * 1000).toLocaleString(),
          note: r[3],
        });
      }
      setHistory(recs);
      setMessage(`Loaded product #${id}`);
    } catch (e) {
      setProduct(null);
      setHistory([]);
      handleError(e, "Product not found");
    }
  }

  async function verifyProduct() {
    try {
      const ok = await contract.verifyProduct(
        productId,
        verifyForm.name,
        verifyForm.origin,
        verifyForm.serial
      );
      setVerifyResult(ok);
      setMessage(ok ? "✅ Data matches (authentic)" : "❌ Data does NOT match (tampered)");
    } catch (e) {
      setVerifyResult(null);
      handleError(e, "verify failed");
    }
  }

  return (
    <div className="container">
      <header>
        <h1>🔗 Blockchain Supply Chain Tracker</h1>
        <p className="subtitle">Advanced Information Security — Local Ethereum Demo</p>
      </header>

      <section className="status-bar">
        <span className={connected ? "dot ok" : "dot bad"} />
        <span>{connected ? "Connected to" : "Disconnected from"} {RPC_URL}</span>
        <span>Block #: <b>{blockNumber ?? "-"}</b></span>
        <span>Contract: <code>{deployment.address}</code></span>
      </section>

      <section className="card">
        <h2>Acting as</h2>
        <div className="role-picker">
          {ROLES.map((r, i) => (
            <button
              key={r.address}
              className={i === roleIndex ? "role active" : "role"}
              onClick={() => setRoleIndex(i)}
            >
              {r.name}
            </button>
          ))}
        </div>
        <p className="muted">Address: <code>{role.address}</code></p>
        {roleIndex === 0 && (
          <div className="inline">
            <button onClick={() => authorizeSelf(ROLES[1].address)}>Authorize Distributor</button>
            <button onClick={() => authorizeSelf(ROLES[2].address)}>Authorize Retailer</button>
          </div>
        )}
      </section>

      <div className="grid">
        <section className="card">
          <h2>1. Create product</h2>
          <input placeholder="Product name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Origin" value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })} />
          <input placeholder="Serial number" value={form.serial}
            onChange={(e) => setForm({ ...form, serial: e.target.value })} />
          <button className="primary" onClick={createProduct}>Create on blockchain</button>
        </section>

        <section className="card">
          <h2>2. Load / update status</h2>
          <div className="inline">
            <input style={{ width: 80 }} value={productId}
              onChange={(e) => setProductId(e.target.value)} />
            <button onClick={() => loadProduct(productId)}>Load product</button>
          </div>
          <input placeholder="Note (optional)" value={note}
            onChange={(e) => setNote(e.target.value)} />
          <button className="primary" onClick={updateStatus}>
            Advance to next status
          </button>
        </section>

        <section className="card">
          <h2>3. Verify integrity</h2>
          <input placeholder="Product name" value={verifyForm.name}
            onChange={(e) => setVerifyForm({ ...verifyForm, name: e.target.value })} />
          <input placeholder="Origin" value={verifyForm.origin}
            onChange={(e) => setVerifyForm({ ...verifyForm, origin: e.target.value })} />
          <input placeholder="Serial number" value={verifyForm.serial}
            onChange={(e) => setVerifyForm({ ...verifyForm, serial: e.target.value })} />
          <button className="primary" onClick={verifyProduct}>Verify product</button>
          {verifyResult !== null && (
            <p className={verifyResult ? "verify ok" : "verify bad"}>
              {verifyResult ? "✔ AUTHENTIC — hash matches" : "✘ TAMPERED — hash mismatch"}
            </p>
          )}
        </section>
      </div>

      {message && <p className="message">{message}</p>}

      {product && (
        <section className="card">
          <h2>Product #{product.id}</h2>
          <table className="kv">
            <tbody>
              <tr><td>Name</td><td>{product.name}</td></tr>
              <tr><td>Origin</td><td>{product.origin}</td></tr>
              <tr><td>Product hash</td><td><code>{product.hash}</code></td></tr>
              <tr><td>Status</td><td><b>{STATUS_LABELS[product.statusIndex]}</b></td></tr>
              <tr><td>Current handler</td><td><code>{product.handler}</code></td></tr>
              <tr><td>Created at</td><td>{product.createdAt}</td></tr>
            </tbody>
          </table>

          <h3>History (audit trail)</h3>
          <table className="grid-table">
            <thead><tr><th>#</th><th>Status</th><th>Updated by</th><th>Time</th><th>Note</th></tr></thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td>{i}</td><td>{h.status}</td>
                  <td><code>{h.updatedBy.slice(0, 12)}…</code></td>
                  <td>{h.timestamp}</td><td>{h.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {txLog.length > 0 && (
        <section className="card">
          <h2>Transaction log</h2>
          <table className="grid-table">
            <thead><tr><th>Action</th><th>Tx hash</th><th>Block</th><th>From</th></tr></thead>
            <tbody>
              {txLog.map((t, i) => (
                <tr key={i}>
                  <td>{t.action}</td>
                  <td><code>{t.hash.slice(0, 18)}…</code></td>
                  <td>{t.block}</td>
                  <td><code>{t.from.slice(0, 12)}…</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
