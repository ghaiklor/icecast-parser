module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  errorOnDeprecated: true,
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)']
};
