/** @type {import('next').NextConfig} */

const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ["@frankencoin/zchf", "@frankencoin/api"],

	webpack: (config) => {
		// Stub out optional peer deps not used in this app
		config.resolve.alias = {
			...config.resolve.alias,
			"pino-pretty": false,
			lokijs: false,
			encoding: false,
			"@metamask/connect-evm": false,
			porto: false,
			"@base-org/account": false,
			accounts: false,
		};
		return config;
	},

	// @dev: if you want to set the iFrame SAMEORIGIN headers,
	// to prevent injecting in cross domains.
	// headers: [
	// 	{
	// 		key: "X-Frame-Options",
	// 		value: "SAMEORIGIN",
	// 	},
	// ],

	// @dev: Needed for SAFE testing locally
	headers: async () => [
		{
			source: "/(.*)",
			headers: [
				{
					key: "Content-Security-Policy",
					value: "frame-ancestors 'self' https://app.safe.global https://*.safe.global",
				},
			],
		},
		{
			source: "/manifest.json",
			headers: [
				{
					key: "Access-Control-Allow-Origin",
					value: "*",
				},
				{
					key: "Access-Control-Allow-Methods",
					value: "GET",
				},
				{
					key: "Access-Control-Allow-Headers",
					value: "X-Requested-With, content-type, Authorization",
				},
			],
		},
	],
};

module.exports = nextConfig;
