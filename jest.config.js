module.exports = {
  testEnvironment: 'node',
  preset: '@react-native/jest-preset',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  transform: {
    '\\.jsx?$': 'babel-jest',
    '\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // pnpm keeps packages under node_modules/.pnpm/<pkg>@<version>/node_modules/<pkg>,
  // so the react-native preset's default pattern never matches; allow both layouts
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/)?((jest-)?react-native|@react-native(-community)?))',
  ],
  testPathIgnorePatterns: ['node_modules', 'lib'],
};
