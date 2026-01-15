// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // Expo Router + TS path aliases: el bundler resuelve, pero ESLint puede no conocer el alias.
      // En fases posteriores podemos configurar eslint-import-resolver-typescript.
      'import/no-unresolved': 'off',
    },
  },
]);
