/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ["@deuro/eurocoin", "@deuro/api"],
	i18n,
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
