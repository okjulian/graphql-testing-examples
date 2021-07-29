/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
const path = require('path')

module.exports = {
  preset: 'ts-jest',
  testEnvironment: path.join(__dirname, 'prisma-test-environment.js'),
}
