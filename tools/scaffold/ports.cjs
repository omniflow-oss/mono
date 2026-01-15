const fs = require("node:fs");
const yaml = require("js-yaml");

const PORTS_PATH = "infra/ports.yaml";
const RANGES = {
	service: { start: 8081, end: 8199 },
	app: { start: 3001, end: 3099 },
};

function readPorts() {
	const raw = fs.readFileSync(PORTS_PATH, "utf8");
	return yaml.load(raw);
}

function writePorts(data) {
	fs.writeFileSync(PORTS_PATH, yaml.dump(data, { lineWidth: -1 }));
}

function allocateNextPort({ used, start, end }) {
	for (let p = start; p <= end; p += 1) {
		if (!used.includes(p)) return p;
	}
	throw new Error("No free ports in range");
}

function allocateServicePort(name) {
	const data = readPorts();
	const used = Object.values(data.back.services || {});
	const port = allocateNextPort({ used, ...RANGES.service });
	data.back.services[name] = port;
	writePorts(data);
	return port;
}

function allocateAppPort(name) {
	const data = readPorts();
	const used = Object.values(data.front.apps || {});
	const port = allocateNextPort({ used, ...RANGES.app });
	data.front.apps[name] = port;
	writePorts(data);
	return port;
}

function listPorts() {
	const data = readPorts();
	console.log(yaml.dump(data, { lineWidth: -1 }));
}

function doctorPorts() {
	const data = readPorts();
	const all = [];
	for (const p of Object.values(data.back.services || {})) all.push(p);
	for (const p of Object.values(data.front.apps || {})) all.push(p);
	const dup = all.find((p, i) => all.indexOf(p) !== i);
	if (dup) throw new Error(`Duplicate port: ${dup}`);

	for (const p of Object.values(data.back.services || {})) {
		if (p < RANGES.service.start || p > RANGES.service.end) {
			throw new Error(`Service port out of range: ${p}`);
		}
	}
	for (const p of Object.values(data.front.apps || {})) {
		if (p < RANGES.app.start || p > RANGES.app.end) {
			throw new Error(`App port out of range: ${p}`);
		}
	}
}

if (require.main === module) {
	const cmd = process.argv[2];
	if (cmd === "list") listPorts();
	if (cmd === "doctor") doctorPorts();
}

module.exports = {
	allocateNextPort,
	allocateServicePort,
	allocateAppPort,
	listPorts,
	doctorPorts,
};
