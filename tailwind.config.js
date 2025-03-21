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
			default: ["Avenir", "Helvetica", "sans-serif"],
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
					primary: "#F0F1F5",
					secondary: "#FFFFFF",
					footer: "#272B38",
				},
				menu: {
					text: "#272B38",
					textactive: "#272B38",
					active: "#F0F1F5",
					hover: "#F5F6F9",
					back: "#FFFFFF",
					separator: "#EAEBF0",
				},
				card: {
					input: {
						label: "#5D647B",
						disabled: "#F5F6F9",
						empty: "#ADB2C2",
						focus: "#3E96F4",
						error: "#E02523",
						border: "#F0F1F5",
						hover: "#0F80F0",
						min: "#065DC1",
						max: "#065DC1",
						reset: "#065DC1", // alt: #fee2e2
					},
					body: {
						primary: "#FFFFFF",
						secondary: "#092f62",
						seperator: "#1e293b",
					},
					content: {
						primary: "#F5F6F9",
						secondary: "#FFFFFF",
						highlight: "#ff293b",
					},
				},
				text: {
					header: "#8B92A8",
					subheader: "#8B92A8",
					active: "#092F62",
					primary: "#272B38",
					secondary: "#8B92A8",
					warning: "#ef4444",
					success: "#22c55e",
				},
				table: {
					header: {
						primary: "#FFFFFF",
						secondary: "#F0F1F5",
					},
					row: {
						primary: "#FFFFFF",
						secondary: "#F0F1F5",
						hover: "#F0F1F5",
					},
				},
				button: {
					default: "#092F62",
					hover: "#0F80F0",
					disabled: "#EAEBF0",
					textdisabled: "#ADB2C2",
				},
			},
		},
	},
	darkMode: "class",
	plugins: [require("flowbite/plugin")({ charts: true })],
};
