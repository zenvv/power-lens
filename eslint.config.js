import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**", "fixtures/**", "reference/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ["./packages/core/tsconfig.eslint.json", "./apps/web/tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Padrão idiomático em React (inclusive documentado pelo próprio
      // next-themes) pra evitar mismatch de hidratação: setar um flag de
      // "montado" ou sincronizar estado a partir de um valor externo (prop,
      // localStorage) dentro de um efeito. A regra nova do plugin marca
      // qualquer setState síncrono dentro de efeito como erro, mas isso
      // reescreveria 4 componentes corretos sem nenhum ganho.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // Componentes gerados pelo shadcn (`npx shadcn add`, ver CLAUDE.md) —
    // exportam variantes (`buttonVariants`, `badgeVariants`) junto do
    // componente de propósito, o que quebra o fast refresh granular. Não
    // editamos esses arquivos à mão, então não vale a pena adaptar o código
    // gerado só pra silenciar o aviso.
    files: ["apps/web/src/components/ui/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["**/*.config.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
