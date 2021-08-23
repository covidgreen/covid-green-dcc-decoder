module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    '!src/**/**/mocks/*.js',
    'src/**/*.ts',
    '!src/**/*.test.js',
    '!src/**/test/**/*.js',
    '!**/node_modules/**',
  ],
}
