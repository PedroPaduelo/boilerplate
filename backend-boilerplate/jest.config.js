/**
 * Jest configuration for backend-boilerplate.
 *
 * Notes:
 * - ts-jest is configured in CommonJS mode to keep things simple and to play
 *   well with the `module: node16` setting used by tsup at build time.
 * - The `@/*` path alias mirrors `tsconfig.json` so tests can resolve
 *   `@/lib/...` just like the runtime code.
 * - Only files under `tests/` are executed. `src/**` is excluded to keep
 *   this config focused on actual test files (no `__tests__` co-located).
 */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: __dirname,
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          target: 'es2022',
          strict: true,
          skipLibCheck: true,
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/@types/**'],
  clearMocks: true,
};
