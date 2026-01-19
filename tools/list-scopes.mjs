import { readdirSync } from "node:fs";
import path from "node:path";

const roots = ["back/services", "back/libs", "front/apps", "front/packages"];
for (const root of roots) {
	try {
		const entries = readdirSync(root, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isDirectory()) console.log(path.join(root, entry.name));
		}
	} catch {
		// ignore missing roots
	}
}
