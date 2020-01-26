module.exports = {
    parser: '@typescript-eslint/parser',
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
            typescript: {},
        },
    },
    plugins: [
        '@typescript-eslint',
        'import',
        'json',
    ],
    extends: ['plugin:@typescript-eslint/recommended'],
    rules: {
        'import/no-extraneous-dependencies': ['error'],
        'arrow-parens': ['error', 'always'],
        'object-curly-spacing': ['error', 'always'],
        'padded-blocks': ['error', { classes: 'always' }],
        'comma-dangle': ['error', {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'always-multiline',
        }],
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-explicit-any': ['error'],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/interface-name-prefix': ['error', 'always'],
        '@typescript-eslint/type-annotation-spacing': ['error', {
            before: false, after: true,
            overrides: {
                arrow: { before: true, after: true },
            },
        }],
        '@typescript-eslint/typedef': ['error', {
            arrayDestructuring: true,
            arrowParameter: true,
            memberVariableDeclaration: true,
            objectDestructuring: true,
            parameter: true,
            propertyDeclaration: true,
            variableDeclaration: true,
        }],
    },
};
