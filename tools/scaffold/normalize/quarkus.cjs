const fs = require("node:fs");
const path = require("node:path");
const { DEFAULT_GROUP_ID } = require("../constants.cjs");

function readBackVersion() {
	const backPomPath = path.join(process.cwd(), "back/pom.xml");
	if (!fs.existsSync(backPomPath)) return "1.0.0-SNAPSHOT";

	const xml = fs.readFileSync(backPomPath, "utf8");
	const match = xml.match(
		/<artifactId>back<\/artifactId>\s*<version>([^<]+)<\/version>/,
	);
	if (match) return match[1];

	const fallback = xml.match(/<version>([^<]+)<\/version>/);
	return fallback ? fallback[1] : "1.0.0-SNAPSHOT";
}

function ensureParentPom(serviceDir) {
	const pomPath = path.join(serviceDir, "pom.xml");
	if (!fs.existsSync(pomPath)) return;

	let xml = fs.readFileSync(pomPath, "utf8");
	if (xml.includes("<parent>")) return;

	const version = readBackVersion();
	const parentBlock = [
		"  <parent>",
		`    <groupId>${DEFAULT_GROUP_ID}</groupId>`,
		"    <artifactId>back</artifactId>",
		`    <version>${version}</version>`,
		"    <relativePath>../..</relativePath>",
		"  </parent>",
	].join("\n");

	xml = xml.replace(
		/<modelVersion>4.0.0<\/modelVersion>/,
		`<modelVersion>4.0.0</modelVersion>\n\n${parentBlock}`,
	);
	fs.writeFileSync(pomPath, xml);
}

function normalizeQuarkus(serviceDir, name, port) {
	ensureParentPom(serviceDir);
	const propsPath = path.join(
		serviceDir,
		"src/main/resources/application.properties",
	);
	const lines = [
		`quarkus.http.port=${port}`,
		"quarkus.http.host=0.0.0.0",
		`quarkus.application.name=${name}`,
	];
	if (!fs.existsSync(propsPath)) {
		fs.writeFileSync(propsPath, `${lines.join("\n")}\n`);
	} else {
		let props = fs.readFileSync(propsPath, "utf8");
		for (const l of lines) {
			const k = l.split("=")[0];
			const exp = new RegExp(`^${k}=.*$`, "m");
			if (exp.test(props)) {
				props = props.replace(exp, l);
			} else {
				props += `\n${l}`;
			}
		}
		fs.writeFileSync(
			propsPath,
			`${props.replace(/\n{2,}/g, "\n")}
`,
		);
	}
}

module.exports = { normalizeQuarkus };
