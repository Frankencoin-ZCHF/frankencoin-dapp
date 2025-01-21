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
			sans: ["Avenir", "Helvetica", "ui-sans-serif"],
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
					primary: "#f5f6f9",
					secondary: "#092f62",
					footer: "#272B38",
				},
				menu: {
					default: {
						text: "#272b37",
						bg: "#ffffff",
					},
					hover: {
						text: "#1d2029",
						bg: "#f5f6f9",
					},
					active: {
						text: "#1d2029",
						bg: "#f0f1f5",
					},
					separator: "#e9ebf0",
					back: "#FFFFFF",
					wallet: {
						bg: "#e4e6eb",
						border: "#ced0da",
						addressborder: "#8b91a7",
					},
				},
				card: {
					body: {
						primary: "#ffffff",
						secondary: "#092f62",
						seperator: "#1e293b",
					},
					content: {
						primary: "#e7e7ea",
						secondary: "#f7f7f9",
						highlight: "#ff293b",
					},
				},
				text: {
					header: "#8b91a7",
					subheader: "#8b91a7",
					active: "#ff44dd",
					primary: "#272b37",
					secondary: "#e2e8f0",
					warning: "#ef4444",
					success: "#22c55e",
					icon: "#adb2c1",
					muted:"#8b91a7",
					error: "#e02523",
					label: "#5c637b",
					title: "#43495c",
				},
				borders: {
					primary: '#e9ebf0',
					secondary: '#ced0da',
					tertiary: '#8b91a7',
					input: '#adb2c1',
					inputFocus: '#3d89f4',
					divider: '#1e293b',
				},
				input: {
					border: "#adb2c1",
					placeholder: "#bdc1cd",
					primary: "#1d2029",
					label: "#adb2c1",
					bg: "#f5f6f9",
					borderFocus: "#3d89f4",
				},
				button: {
					max: {
						bg: "#e4f0fb",
						text: "#092f62",
					},
					primary: {
						disabled: {
							text: "#adb2c1",
							bg: "#e9ebf0",
						},
						default: {
							text: "#ffffff",
							bg: "#092f62",
						},
					},
				},
				table: {
					header: {
						primary: "#FFFFFF",
						secondary: "#F0F1F5",
						active: "#092f62",
						action: "#ced0da",
						default: "#8b91a7",
					},
					row: {
						primary: "#FFFFFF",
						secondary: "#F0F1F5",
						hover: "#F0F1F5",
					},
				},
			},
		},
	},
	darkMode: "class",
	plugins: [require("flowbite/plugin")({ charts: true })],
};
