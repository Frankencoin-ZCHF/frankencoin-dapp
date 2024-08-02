/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./node_modules/flowbite-react/lib/**/*.js"],
	safelist: [
		{
			pattern: /grid-cols-/,
			variants: ["sm", "md", "lg", "xl", "2xl"],
		},
	],
	theme: {
		fontFamily: {
			sans: ["Helvetica", "ui-sans-serif"],
		},
		extend: {
			height: {
				main: "calc(100vh)",
			},
			minHeight: {
				content: "calc(100vh - 230px)",
			},
			transitionProperty: {
				height: "height",
			},
			colors: {
				layout: {
					primary: "#111827",
					secondary: "#e5e7eb",
				},
				card: {
					body: {
						primary: "#020617",
						secondary: "#1e293b",
						seperator: "#1e293b",
					},
					content: {
						primary: "#94a3b8",
						secondary: "#1e293b",
						highlight: "#d1d5db",
					},
				},
				text: {
					header: "#95A3B8",
					subheader: "#677180",
					primary: "#94a3b8",
					secondary: "#e2e8f0",
				},
				tableHeader: {
					primary: "#1e293b",
					secondary: "#d1d5db",
				},
				tableRow: {
					primary: "#1e293b",
					secondary: "#d1d5db",
					hover: "#334155",
				},
			},
			badgePosition: {
				original: "#facc15",
				clone: "#38bdf8",
			},
		},
	},
	darkMode: "class",
	plugins: [require("flowbite/plugin")({ charts: true })],
};
