export default {
    testEnvironment: 'node',
    transform: {},
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^src/(.*)\\.js$': '<rootDir>/src/$1'
    },
    testMatch: ["**/tests/**/*.test.js"],

    collectCoverageFrom: [
        'src/controllers/**/*.js',
        '!src/controllers/**/index.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
    testTimeout: 10000
};
