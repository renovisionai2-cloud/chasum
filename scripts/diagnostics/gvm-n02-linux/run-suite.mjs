import { spawn, execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import os from "node:os";

const [suite, directory] = process.argv.slice(2);
const suites = {
  reception: ["tests/unit/dashboard/m1c-reception-compatibility.test.tsx", "tests/unit/dashboard/m1c-reception-teardown.test.ts"],
  n02: ["tests/unit/booking/custom-payment-amount-input.test.tsx", "tests/unit/booking/custom-payment-submission.test.ts", "tests/unit/booking/custom-payment-amount-browser.test.ts"],
};
if (!suites[suite] || !directory) throw new Error("Expected reception|n02 and an external evidence directory");
const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim();
if (source !== "f72af50366224ac2630053e16d4b0cac443ff253" || tree !== "cffaea928abe6c58626a631ea92333857b7cf4b6") throw new Error("Wrong immutable source");
const out = resolve(directory);
mkdirSync(out, { recursive: true });
const stamp = () => new Date().toISOString();
const append = (name, value) => appendFileSync(resolve(out, suite + "-" + name), value);
const counts = {}, pending = {}, markers = [], trackedPids = new Set();
let sampleBusy = false;
function sample(reason) {
  if (sampleBusy) return;
  sampleBusy = true;
  try {
    const raw = execFileSync("ps", process.platform === "linux"
      ? ["-eo", "pid,ppid,stat,etimes,comm"]
      : ["-axo", "pid,ppid,state,etime,comm"], { encoding: "utf8", timeout: 1500 });
    const rows = raw.split("\n").slice(1).map(line => {
      const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.+)$/);
      return m ? { pid: +m[1], ppid: +m[2], state: m[3], elapsed: m[4], command: m[5] } : null;
    }).filter(Boolean);
    trackedPids.add(process.pid);
    let found = true;
    while (found) {
      found = false;
      for (const row of rows) if (trackedPids.has(row.ppid) && !trackedPids.has(row.pid)) {
        trackedPids.add(row.pid); found = true;
      }
    }
    const selected = rows.filter(row => trackedPids.has(row.pid));
    for (const row of selected) if (process.platform === "linux") {
      for (const key of ["wchan", "task/" + row.pid + "/children"]) {
        try { row[key] = readFileSync("/proc/" + row.pid + "/" + key, "utf8").trim(); }
        catch (error) { row[key] = "UNAVAILABLE:" + error.code; }
      }
    }
    append("processes.jsonl", JSON.stringify({ at: stamp(), reason, processes: selected, absentTrackedPids: [...trackedPids].filter(pid => !rows.some(row => row.pid === pid)) }) + "\n");
  } catch (error) {
    append("processes.jsonl", JSON.stringify({ at: stamp(), reason, observationError: error.message }) + "\n");
  } finally { sampleBusy = false; }
}
function observe(line) {
  // Counts are inferred from pw:api names, not internal operation IDs.
  const api = line.match(/pw:api\s+(=>|<=)\s+(\S+)\s+(started|succeeded|failed)/);
  if (api) {
    const [, direction, name, status] = api;
    const key = name + ":" + status;
    counts[key] = (counts[key] || 0) + 1;
    pending[name] = (pending[name] || 0) + (direction === "=>" ? 1 : -1);
    if (pending[name] === 0) delete pending[name];
  }
  if (/m1c-teardown|process did exit|gracefully close|<kill>|<forcefully close/.test(line)) {
    markers.push({ at: stamp(), line, inferredOutstandingOperations: { ...pending } });
    append("lifecycle.jsonl", JSON.stringify(markers.at(-1)) + "\n");
    sample("lifecycle-marker");
  }
}
const command = ["run", "test", "--", ...suites[suite], "--maxWorkers=1"];
writeFileSync(resolve(out, suite + "-invocation.json"), JSON.stringify({
  at: stamp(), source, tree, command: ["npm", ...command], platform: os.platform(), release: os.release(), arch: os.arch(), node: process.version,
  instrumentation: "External stdout/stderr observer and process sampler only. No source hooks, timeout changes, assertions, retries or injected browser behavior.",
}, null, 2) + "\n");
const child = spawn("npm", command, { env: { ...process.env, DEBUG: "pw:api,pw:browser", DEBUG_COLORS: "0", CHASUM_M1C_DIAGNOSTICS_VERBOSE: "1" }, stdio: ["ignore", "pipe", "pipe"] });
trackedPids.add(child.pid);
for (const [name, stream, target] of [["stdout", child.stdout, process.stdout], ["stderr", child.stderr, process.stderr]]) {
  let remainder = "";
  stream.setEncoding("utf8");
  stream.on("data", chunk => {
    append(name + ".log", chunk);
    target.write(chunk);
    remainder += chunk.replace(/\x1b\[[0-9;]*m/g, "");
    const lines = remainder.split("\n"); remainder = lines.pop();
    for (const line of lines) observe(line);
  });
  stream.on("end", () => { if (remainder) observe(remainder); });
}
sample("start");
const timer = setInterval(() => sample("periodic"), 2000);
const result = await new Promise((done, fail) => {
  child.on("error", fail);
  child.on("close", (code, signal) => done({ code, signal }));
}).finally(() => clearInterval(timer));
sample("child-close");
writeFileSync(resolve(out, suite + "-summary.json"), JSON.stringify({
  at: stamp(), ...result, counts, inferredOutstandingOperations: pending, lifecycle: markers,
  note: "Absent PID is observation, not a substitute for a recorded exit. No kill command is issued by this collector. Test exit status is propagated unchanged.",
}, null, 2) + "\n");
process.exitCode = result.code === 0 && result.signal === null ? 0 : (result.code || 1);
