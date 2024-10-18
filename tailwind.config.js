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
					primary: "#ffffff",
					secondary: "#092f62",
					footer: "#272B38",
				},
				menu: {
					text: "#092f62",
					active: "#092f62",
					hover: "#b7bfd1",
					separator: "#f7f7f9",
				},
				card: {
					body: {
						primary: "#f7f7f9",
						secondary: "#092f62",
						seperator: "#1e293b",
					},
					content: {
						primary: "#e7e7ea", // e7e7ea
						secondary: "#f7f7f9",
						highlight: "#ff293b",
					},
				},
				text: {
					header: "#092f62",
					subheader: "#677180",
					active: "#ff44dd",
					primary: "#092f62",
					secondary: "#e2e8f0",
					warning: "#ef4444",
					success: "#22c55e",
				},
				table: {
					header: {
						primary: "#f7f7f9",
						secondary: "#d1d5db",
					},
					row: {
						primary: "#f7f7f9",
						secondary: "#d1d5db",
						hover: "#d1d5db",
					},
				},
			},
		},
	},
	darkMode: "class",
	plugins: [require("flowbite/plugin")({ charts: true })],
};
