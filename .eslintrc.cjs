module.exports = {
	env: {
		es2021: true,
		node: true,
	},
	extends: ['xo'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint'],
	rules: {
		'comma-dangle': 'off',
	},
};
