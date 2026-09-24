// Flashcard App - decks and studying run in the browser. The AUTO-TRANSLATE button (fills in the back
// of a vocabulary card) uses QVAC translation on YOUR machine. Open http://localhost:3010 after starting.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadModel, translate } from "@qvac/sdk";
import * as sdk from "@qvac/sdk"; // used only to look up the translation model constants by name

const PORT = 3010;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Each translation model handles ONE direction, so we offer a few pairs.
const PAIRS = {
  "en-es": { model: "BERGAMOT_EN_ES", from: "en", to: "es" },
  "en-fr": { model: "BERGAMOT_EN_FR", from: "en", to: "fr" },
  "en-it": { model: "BERGAMOT_EN_IT", from: "en", to: "it" },
  "es-en": { model: "BERGAMOT_ES_EN", from: "es", to: "en" },
};

// ---- Step 1: load a translation model the first time a language pair is used (small download) ----
const loaders = new Map(); // pair -> Promise that gives the modelId
const state = {};          // pair -> "loading" | "ready" | "error"

function getModel(key) {
  if (!loaders.has(key)) {
    const p = PAIRS[key];
    const modelSrc = sdk[p.model];
    if (!modelSrc) throw new Error("This SDK version has no " + p.model + " model.");
    state[key] = "loading";
    const promise = loadModel({
      modelSrc,
      modelType: "nmt",
      modelConfig: { engine: "Bergamot", from: p.from, to: p.to, beamsize: 4, temperature: 0.3 },
    }).then((id) => { state[key] = "ready"; return id; })
      .catch((err) => { state[key] = "error"; loaders.delete(key); throw err; });
    loaders.set(key, promise);
  }
  return loaders.get(key);
}

// ---- Step 2: translate one short piece of text ----
let chain = Promise.resolve(); // one job at a time
function enqueue(job) { const p = chain.then(job); chain = p.catch(() => {}); return p; }

async function translateText(key, text) {
  const modelId = await getModel(key);

  // This is the QVAC call that translates text, on-device
  const result = translate({ modelId, text, modelType: "nmt", stream: false });
  return (await result.text).trim().replace(/^-\s+/, ""); // drop a stray leading "- " some models add
}

// ---- Step 3: a small web server ----
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 5000) { reject(new Error("Too big")); req.destroy(); } });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(await readFile(path.join(__dirname, "public", "index.html")));
  }
  if (req.method === "GET" && req.url === "/api/status") return json(res, 200, { ok: true, pairs: state });

  if (req.method === "POST" && req.url === "/api/translate") {
    try {
      const { text = "", pair = "" } = JSON.parse(await readBody(req));
      const clean = String(text).replace(/\s+/g, " ").trim().slice(0, 200);
      if (!PAIRS[pair]) return json(res, 400, { error: "Unknown language pair." });
      if (!clean) return json(res, 400, { error: "Nothing to translate." });
      return json(res, 200, { text: await enqueue(() => translateText(pair, clean)) });
    } catch (err) {
      console.error(err);
      return json(res, 500, { error: String(err?.message || err) });
    }
  }

  res.writeHead(404);
  res.end("Not found");
});

// "127.0.0.1" means only YOUR computer can reach this app
server.listen(PORT, "127.0.0.1", () => console.log("Server running at http://localhost:" + PORT));
