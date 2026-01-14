import { spawn } from "node:child_process";

const cmds = process.argv.slice(2);
if (cmds.length === 0) process.exit(0);

const procs = cmds.map((c) => spawn(c, { shell: true, stdio: "inherit" }));
let code = 0;
procs.forEach((p) => p.on("exit", (c) => { if (c) code = c; }));
process.on("exit", () => process.exit(code));
