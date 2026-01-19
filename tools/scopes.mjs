export const isBackScope = (scope) =>
	scope.startsWith("back/services/") || scope.startsWith("back/libs/");

export const isFrontScope = (scope) =>
	scope.startsWith("front/apps/") || scope.startsWith("front/packages/");

export const mvnForScope = (scope, goal, extra = []) => {
	const name = scope.split("/").pop();
	return [
		"mvn",
		["-f", "back/pom.xml", "-pl", `:${name}`, "-am", goal, ...extra],
	];
};

export const pnpmForScope = (scope, script, extra = []) => [
	"pnpm",
	["-C", scope, script, ...extra],
];
