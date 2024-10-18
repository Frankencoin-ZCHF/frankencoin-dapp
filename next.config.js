/** @type {import('next').NextConfig} */

const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ["@frankencoin/zchf", "@frankencoin/api"],

	// @dev: if you want to set the iFrame SAMEORIGIN headers,
	// to prevent injecting in cross domains.
	// headers: [
	// 	{
	// 		key: "X-Frame-Options",
	// 		value: "SAMEORIGIN",
	// 	},
	// ],
};

module.exports = nextConfig;
