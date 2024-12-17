module.exports = {
  roots: ["<rootDir>/src"], // Adjust the root directory if necessary
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/.next/",
    "/out/",
    "/coverage/",
    "/public/",
    "/scripts/",
    "/config/",
    "/mocks/",
    "/migrations/",
    "/seed/",
  ],
};
