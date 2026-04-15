/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1', // Maps imports like './file.js' to './file' for ts-jest
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                diagnostics: {
                    ignoreCodes: [151002],
                },
            },
        ],
    },
    extensionsToTreatAsEsm: ['.ts'],
};
