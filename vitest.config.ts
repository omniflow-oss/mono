import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: [
			"tools/**/*.test.{js,mjs,ts,mts}",
			"front/packages/**/*.test.{js,mjs,ts,mts,tsx}",
		],
		exclude: [
			"**/node_modules/**",
			"**/.nuxt/**",
			"**/dist/**",
			"**/.vitepress/**",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"**/node_modules/**",
				"**/.nuxt/**",
				"**/dist/**",
				"**/.vitepress/**",
				"**/*.config.{js,ts}",
				"**/*.d.ts",
				"**/test/**",
				"**/*.test.{js,ts}",
				"**/*.spec.{js,ts}",
				"tools/contracts/**",
				"tools/scaffold/**",
			],
			all: true,
			lines: 80,
			functions: 80,
			branches: 80,
			statements: 80,
		},
		reporters: ["default", "junit"],
		outputFile: "./reports/vitest/junit.xml",
	},
});
