export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"type-enum": [
			2,
			"always",
			[
				"feat",
				"fix",
				"docs",
				"style",
				"refactor",
				"perf",
				"test",
				"build",
				"ci",
				"chore",
				"revert",
				"wip",
			],
		],
		"scope-enum": [0, "always", []],
		"subject-case": [0, "always"],
		"body-max-line-length": [0, "always"],
	},
};
