{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/../backend"],
  "testMatch": ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/node_modules/**"
  ],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/../backend/src/$1"
  },
  "coverageDirectory": "coverage",
  "coverageReporters": ["html", "text", "lcov"],
  "extensionsToTreatAsEsm": [".ts"],
  "modulePaths": ["<rootDir>"],
  "moduleDirectories": ["node_modules", "<rootDir>"],
  "moduleResolution": "node16"
}
