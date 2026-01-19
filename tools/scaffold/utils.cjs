const fs = require("node:fs");
const { spawnSync } = require("node:child_process");

function validateKebab(name) {
	if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
		throw new Error("Invalid name; use lowercase-kebab");
	}
}

function run(command, args, options = {}) {
	const result = spawnSync(command, args, { stdio: "inherit", ...options });
	if (result.status) {
		throw new Error(`${command} failed with exit code ${result.status}`);
	}
}

function ensureDir(target) {
	fs.mkdirSync(target, { recursive: true });
}

module.exports = { ensureDir, run, validateKebab };
