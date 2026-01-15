const fs = require("node:fs");

function moveDir(src, dest) {
	try {
		fs.renameSync(src, dest);
	} catch (err) {
		if (err && err.code === "EXDEV") {
			fs.cpSync(src, dest, { recursive: true });
			fs.rmSync(src, { recursive: true, force: true });
			return;
		}
		throw err;
	}
}

module.exports = { moveDir };
