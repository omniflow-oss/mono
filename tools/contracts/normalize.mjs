import yaml from "js-yaml";

export function normalizeOpenapi(raw) {
	const data = yaml.load(raw);
	if (data && typeof data === "object") {
		const { servers, ...rest } = data;
		return yaml.dump(rest, { lineWidth: -1, sortKeys: true });
	}
	return yaml.dump(data, { lineWidth: -1, sortKeys: true });
}
