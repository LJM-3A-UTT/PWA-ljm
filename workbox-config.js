module.exports = {
	globDirectory: 'my-pwa/',
	globPatterns: [
		'**/*.{js,html,json,svg,md,css,tsx,ts}'
	],
	swDest: 'my-pwa/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};