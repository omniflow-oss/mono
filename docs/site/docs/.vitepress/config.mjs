export default {
	title: "OmniflowCX",
	description: "Monorepo tooling, scaffolding, and contracts documentation",
	base: "/mono/",
	themeConfig: {
		nav: [
			{ text: "Guide", link: "/" },
			{ text: "Reference", link: "/architecture" },
		],
		sidebar: [
			{
				text: "Getting Started",
				items: [
					{ text: "Overview", link: "/" },
					{ text: "Setup", link: "/setup" },
					{ text: "Workflows", link: "/workflows" },
				],
			},
			{
				text: "Development",
				items: [
					{ text: "Scaffolding", link: "/scaffolding" },
					{ text: "Contracts", link: "/contracts" },
					{ text: "Architecture", link: "/architecture" },
					{ text: "CI and Tooling", link: "/ci-tooling" },
					{ text: "Conventions", link: "/conventions" },
					{ text: "Troubleshooting", link: "/troubleshooting" },
				],
			},
		],
	},
};
