import { spawn, execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import os from "node:os";

const [directory] = process.argv.slice(2);
const suite = "full";
if (!directory) throw new Error("Expected external evidence directory");
const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim();
const parent = execFileSync("git", ["rev-parse", "HEAD^"], { encoding: "utf8" }).trim();
if (parent !== "40515bfa59d1bb035a34c735f7285819d5703f79") throw new Error("Wrong immutable application parent");
const out = resolve(directory);
mkdirSync(out, { recursive: true });
const stamp = () => new Date().toISOString();
const append = (name, value) => appendFileSync(resolve(out, suite + "-" + name), value);
const markers = [], trackedPids = new Set();
let sampleCount = 0;
let sampleBusy = false;
function sample(reason) {
  if (sampleBusy || sampleCount++ >= 6000) return;
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
  if (/n02-lifecycle|m1c-teardown|process did exit|launched> pid=|gracefully close|<kill>|<forcefully close|Unhandled|unhandled/.test(line)) {
    if (markers.length >= 6000) return;
    markers.push({ at: stamp(), line });
    append("lifecycle.jsonl", JSON.stringify(markers.at(-1)) + "\n");
    sample("lifecycle-marker");
  }
}
const command = ["run", "test", "--", "--maxWorkers=1"];
writeFileSync(resolve(out, suite + "-invocation.json"), JSON.stringify({
  at: stamp(), source, tree, parent, command: ["npm", ...command], platform: os.platform(), release: os.release(), arch: os.arch(), node: process.version,
  instrumentation: "N02 lifecycle observers plus external browser/process observations. Original hook deadline, all test assertions and all other suites unchanged. No retries or kills.",
}, null, 2) + "\n");
const child = spawn("npm", command, { env: { ...process.env, DEBUG: "pw:browser", DEBUG_COLORS: "0", CHASUM_N02_LIFECYCLE_FILE: resolve(out, "n02-lifecycle.jsonl") }, stdio: ["ignore", "pipe", "pipe"] });
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
const timer = setInterval(() => sample("periodic"), 1000);
const result = await new Promise((done, fail) => {
  child.on("error", fail);
  child.on("close", (code, signal) => done({ code, signal }));
}).finally(() => clearInterval(timer));
sample("child-close");
writeFileSync(resolve(out, suite + "-summary.json"), JSON.stringify({
  at: stamp(), ...result, lifecycle: markers,
  note: "Absent PID is observation, not a substitute for a recorded exit. No kill command is issued by this collector. Test exit status is propagated unchanged.",
}, null, 2) + "\n");
process.exitCode = result.code === 0 && result.signal === null ? 0 : (result.code || 1);
