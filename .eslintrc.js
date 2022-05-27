module.exports = {
	env: {
		es2021: true,
		node: true,
	},
	extends: ['xo', 'xo-typescript'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint'],
	rules: {
		'@typescript-eslint/comma-dangle': 'off',
		'operator-linebreak': 'off',
		'@typescript-eslint/indent': 'off',
		'@typescript-eslint/naming-convention': 'off',
		'arrow-body-style': 'off',
		'@typescript-eslint/ban-types': 'off',
		'@typescript-eslint/quotes': 'off',
		'@typescript-eslint/triple-slash-reference': 'off',
		'jsx-quotes': ['error', 'prefer-double'],
	},
	ignorePatterns: ['dist'],
};
