"use strict";

/* ---------- State ---------- */
let queuedFiles = [];     // [{file, relativePath}]
let scanResults = [];     // [{name, path, size, hashes:{ALGO:hex}}]
let importedSet = null;   // parsed .fpj content

/* ---------- Tab navigation ---------- */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
  });
});

/* ---------- File selection ---------- */
const folderInput = document.getElementById("folderInput");
const filesInput = document.getElementById("filesInput");
const queueSummary = document.getElementById("queueSummary");
const clearBtn = document.getElementById("clearBtn");

folderInput.addEventListener("change", (e) => addFilesToQueue(e.target.files));
filesInput.addEventListener("change", (e) => addFilesToQueue(e.target.files));

clearBtn.addEventListener("click", () => {
  queuedFiles = [];
  folderInput.value = "";
  filesInput.value = "";
  renderQueueSummary();
});

function addFilesToQueue(fileList) {
  const incoming = Array.from(fileList).map((file) => ({
    file,
    relativePath: file.webkitRelativePath || file.name,
  }));
  queuedFiles = incoming; // each new selection replaces the queue to avoid duplicate confusion
  renderQueueSummary();
}

function renderQueueSummary() {
  if (queuedFiles.length === 0) {
    queueSummary.textContent = "No files selected yet.";
    return;
  }
  const totalBytes = queuedFiles.reduce((sum, f) => sum + f.file.size, 0);
  queueSummary.textContent =
    queuedFiles.length + " file(s) queued — " + formatBytes(totalBytes);
}

/* ---------- Hashing ---------- */
const NATIVE_ALGOS = {
  "SHA-1": "SHA-1",
  "SHA-256": "SHA-256",
  "SHA-512": "SHA-512",
};

async function hashFile(file, algorithms) {
  const buffer = await file.arrayBuffer();
  const hashes = {};

  for (const algo of algorithms) {
    if (algo === "MD5") {
      hashes.MD5 = md5ArrayBuffer(buffer);
    } else if (NATIVE_ALGOS[algo]) {
      const digest = await crypto.subtle.digest(NATIVE_ALGOS[algo], buffer);
      hashes[algo] = bufferToHex(digest);
    }
  }
  return hashes;
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2) + " " + units[i];
}

/* ---------- Scan trigger ---------- */
const startScanBtn = document.getElementById("startScanBtn");
const progressWrap = document.getElementById("progressWrap");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const statusPill = document.getElementById("statusPill");
const statusText = document.getElementById("statusText");

startScanBtn.addEventListener("click", async () => {
  if (queuedFiles.length === 0) {
    setStatus("No files selected", "idle");
    return;
  }

  const algorithms = Array.from(
    document.querySelectorAll('input[name="algo"]:checked')
  ).map((cb) => cb.value);

  if (algorithms.length === 0) {
    setStatus("Pick at least one algorithm", "idle");
    return;
  }

  startScanBtn.disabled = true;
  progressWrap.hidden = false;
  setStatus("Hashing…", "busy");
  scanResults = [];

  for (let i = 0; i < queuedFiles.length; i++) {
    const { file, relativePath } = queuedFiles[i];
    progressLabel.textContent = (i + 1) + " / " + queuedFiles.length + "  " + relativePath;
    progressFill.style.width = Math.round(((i + 1) / queuedFiles.length) * 100) + "%";

    try {
      const hashes = await hashFile(file, algorithms);
      scanResults.push({
        name: file.name,
        path: relativePath,
        size: file.size,
        hashes,
      });
    } catch (err) {
      scanResults.push({
        name: file.name,
        path: relativePath,
        size: file.size,
        hashes: {},
        error: String(err),
      });
    }
    // yield to keep UI responsive
    await new Promise((r) => setTimeout(r, 0));
  }

  startScanBtn.disabled = false;
  setStatus("Done — " + scanResults.length + " file(s)", "done");
  renderResultsTable();
  document.querySelector('.tab[data-tab="results"]').click();
});

function setStatus(text, mode) {
  statusText.textContent = text;
  statusPill.classList.remove("busy", "done");
  if (mode === "busy") statusPill.classList.add("busy");
  if (mode === "done") statusPill.classList.add("done");
}

/* ---------- Results table ---------- */
const resultsBody = document.getElementById("resultsBody");

function renderResultsTable() {
  if (scanResults.length === 0) {
    resultsBody.innerHTML = '<tr class="empty-row"><td colspan="4">No results yet — run a scan first.</td></tr>';
    return;
  }

  resultsBody.innerHTML = scanResults
    .map((r) => {
      const hashLines = Object.entries(r.hashes)
        .map(
          ([algo, hex]) =>
            '<div class="hash-line"><span class="hash-tag">' +
            algo +
            '</span><span class="hash-value">' +
            hex +
            "</span></div>"
        )
        .join("");
      const errorLine = r.error
        ? '<div class="hash-line"><span class="hash-tag">ERROR</span><span class="hash-value">' + escapeHtml(r.error) + "</span></div>"
        : "";
      return (
        "<tr>" +
        '<td class="file-name">' + escapeHtml(r.name) + "</td>" +
        '<td class="file-path">' + escapeHtml(r.path) + "</td>" +
        '<td class="file-size">' + formatBytes(r.size) + "</td>" +
        '<td class="hash-col">' + hashLines + errorLine + "</td>" +
        "</tr>"
      );
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- Export ---------- */
document.getElementById("exportTxtBtn").addEventListener("click", () => {
  if (scanResults.length === 0) return;
  let lines = [];
  for (const r of scanResults) {
    for (const [algo, hex] of Object.entries(r.hashes)) {
      lines.push(hex + "  " + algo + "  " + r.path);
    }
  }
  downloadTextFile(lines.join("\n") + "\n", "fingerprints.txt", "text/plain");
});

document.getElementById("exportJsonBtn").addEventListener("click", () => {
  if (scanResults.length === 0) return;
  downloadTextFile(JSON.stringify(buildFingerprintPayload(), null, 2), "fingerprints.fpj", "application/json");
});

document.getElementById("exportJsonPlainBtn").addEventListener("click", () => {
  if (scanResults.length === 0) return;
  downloadTextFile(JSON.stringify(buildFingerprintPayload(), null, 2), "fingerprints.json", "application/json");
});

function buildFingerprintPayload() {
  return {
    format: "FileFingerprint-FPJ",
    version: 1,
    generatedAt: new Date().toISOString(),
    fileCount: scanResults.length,
    entries: scanResults.map((r) => ({
      name: r.name,
      path: r.path,
      size: r.size,
      hashes: r.hashes,
    })),
  };
}

function downloadTextFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- Import + Compare ---------- */
const importInput = document.getElementById("importInput");
const importStatus = document.getElementById("importStatus");
const compareBtn = document.getElementById("compareBtn");
const compareBody = document.getElementById("compareBody");

importInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();

  try {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".txt")) {
      importedSet = parseTxtFingerprint(text);
    } else if (lowerName.endsWith(".json") || lowerName.endsWith(".fpj")) {
      const parsed = JSON.parse(text);
      importedSet = parsed.entries || [];
    } else {
      // unknown extension — sniff content
      const trimmed = text.trim();
      importedSet = trimmed.startsWith("{") ? (JSON.parse(trimmed).entries || []) : parseTxtFingerprint(text);
    }
    importStatus.textContent = importedSet.length + " entr" + (importedSet.length === 1 ? "y" : "ies") + " loaded from " + file.name;
  } catch (err) {
    importedSet = null;
    importStatus.textContent = "Failed to parse file: " + err.message;
  }
});

function parseTxtFingerprint(text) {
  // lines look like: HEX  ALGO  path
  const entries = {};
  text.split("\n").forEach((line) => {
    const parts = line.trim().split(/\s{2,}/);
    if (parts.length < 3) return;
    const [hex, algo, path] = parts;
    if (!entries[path]) entries[path] = { path, name: path.split("/").pop(), hashes: {} };
    entries[path].hashes[algo] = hex;
  });
  return Object.values(entries);
}

compareBtn.addEventListener("click", () => {
  if (!importedSet) {
    renderCompareTable([{ status: "error", file: "—", details: "Import a fingerprint file first." }]);
    return;
  }
  if (scanResults.length === 0) {
    renderCompareTable([{ status: "error", file: "—", details: "Run a scan to compare against." }]);
    return;
  }

  const currentByPath = new Map(scanResults.map((r) => [r.path, r]));
  const importedByPath = new Map(importedSet.map((r) => [r.path, r]));
  const rows = [];

  // matches / modified / missing
  for (const [path, oldEntry] of importedByPath) {
    const current = currentByPath.get(path);
    if (!current) {
      rows.push({ status: "missing", file: path, details: "Present in imported set, not found in current scan." });
      continue;
    }
    const identical = hashesEqual(oldEntry.hashes, current.hashes);
    if (identical) {
      rows.push({ status: "match", file: path, details: "All shared hash values are identical." });
    } else {
      rows.push({ status: "modified", file: path, details: "File exists but hash values differ — content has changed." });
    }
  }

  // new files present now but not in imported set
  for (const [path] of currentByPath) {
    if (!importedByPath.has(path)) {
      rows.push({ status: "new", file: path, details: "Found in current scan, not present in imported set." });
    }
  }

  renderCompareTable(rows);
});

function hashesEqual(a, b) {
  const sharedAlgos = Object.keys(a).filter((algo) => algo in b);
  if (sharedAlgos.length === 0) return false; // nothing comparable
  return sharedAlgos.every((algo) => a[algo].toLowerCase() === b[algo].toLowerCase());
}

function renderCompareTable(rows) {
  if (rows.length === 0) {
    compareBody.innerHTML = '<tr class="empty-row"><td colspan="3">No differences found.</td></tr>';
    return;
  }
  compareBody.innerHTML = rows
    .map(
      (r) =>
        "<tr><td><span class=\"status-badge " + r.status + "\">" + r.status.toUpperCase() + "</span></td>" +
        "<td class=\"file-path\">" + escapeHtml(r.file) + "</td>" +
        "<td>" + escapeHtml(r.details) + "</td></tr>"
    )
    .join("");
}
