import { spawn } from "node:child_process";

const cmds = process.argv.slice(2);
if (cmds.length === 0) process.exit(0);

let finished = 0;
let exitCode = 0;
const total = cmds.length;

for (const c of cmds) {
	const proc = spawn(c, { shell: true, stdio: "inherit" });
	proc.on("exit", (code) => {
		if (code && code > exitCode) exitCode = code;
		finished++;
		if (finished === total) process.exit(exitCode);
	});
}
