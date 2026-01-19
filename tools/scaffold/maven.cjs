const fs = require("node:fs");

function insertModule(pomPath, modulePath) {
	const xml = fs.readFileSync(pomPath, "utf8");
	const moduleTag = `<module>${modulePath}</module>`;
	if (xml.includes(moduleTag)) return;

	if (xml.includes("<modules>")) {
		const updated = xml.replace("</modules>", `  ${moduleTag}\n</modules>`);
		fs.writeFileSync(pomPath, updated);
		return;
	}

	const updated = xml.replace(
		"</packaging>",
		`</packaging>\n\n  <modules>\n    ${moduleTag}\n  </modules>`,
	);
	fs.writeFileSync(pomPath, updated);
}

function removeModule(pomPath, modulePath) {
	const xml = fs.readFileSync(pomPath, "utf8");
	const moduleTag = `<module>${modulePath}</module>`;
	if (!xml.includes(moduleTag)) return;
	let updated = xml.replace(`  ${moduleTag}\n`, "");
	updated = updated.replace(`${moduleTag}\n`, "");
	updated = updated.replace(`    ${moduleTag}\n`, "");
	fs.writeFileSync(pomPath, updated);
}

module.exports = { insertModule, removeModule };
