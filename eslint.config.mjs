import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "prisma/migrations/**",
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // Too strict for existing sync-with-props / URL params patterns; revisit gradually.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
