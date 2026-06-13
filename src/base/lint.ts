import type { DummyRuleMap, OxlintConfig } from 'vite-plus/lint'

// Rules Config
const nursery: DummyRuleMap = {
  // We hope typescript can process them.
  'no-undef': 'off',
  'import/named': 'off',

  // Disable some too strict ones
  'no-restricted-exports': 'off'
}

// Whitelist mode
const restriction: DummyRuleMap = {
  'oxc/bad-bitwise-operator': 'error',
  'class-methods-use-this': 'error',
  'default-case': 'error',
  'typescript/explicit-function-return-type': 'error',
  'typescript/explicit-module-boundary-types': 'error',
  'import/extensions': ['error', 'always', { checkTypeImports: true, ignorePackages: true }],
  'unicorn/no-abusive-eslint-disable': 'error',
  'no-alert': 'error',
  'import/no-amd': 'error',
  'no-array-reduce': 'error',
  'unicorn/prefer-module': 'error',
  'no-console': 'error',
  'import/no-cycle': 'error',
  'oxc/no-const-enum': 'error',
  'typescript/no-dynamic-delete': 'error',
  'no-dynamic-require': 'error', // For the case like loading config, we should use oxlint-disable to skip this rule.
  'no-empty': 'error',
  'no-empty-function': 'error',
  'no-explicit-any': 'error',
  'no-implicit-globals': 'error',
  'typescript/no-import-type-side-effects': 'error',
  'typescript/no-invalid-void-type': 'error',
  'unicorn/no-magic-array-flat-depth': 'error', // For cases we really need flat depth, use oxlint-disable
  'typescript/no-namespace': 'error',
  'typescript/no-non-null-asserted-nullish-coalescing': 'error',
  'no-param-reassign': 'error',
  'unicorn/no-process-exit': 'error',
  'no-sequences': 'error',
  'no-var': 'error',
  'non-nullable-type-assertion-style': 'error',
  'unicorn/prefer-modern-math-apis': 'error',
  'unicode-bom': 'error',

  'prefer-node-protocol': 'warn',
  'unicorn/prefer-number-properties': 'warn',
  'no-array-for-each': 'warn',
  'no-div-regex': 'warn',

  'no-default-export': 'warn',
  'no-empty-object-type': 'warn',
  'no-proto': 'warn'
}

const pedantic: DummyRuleMap = {
  eqeqeq: 'error',
  'oxc/branches-sharing-code': 'error',
  'array-callback-return': 'error',
  'unicorn/consistent-empty-array-spread': 'error',
  // We hope not to use classes, if there is a case we have to use, just use oxlint-disable to disable it.
  'max-classes-per-file': ['error', { max: 0 }],
  'max-depth': ['error', { max: 5 }],
  'eslint/max-nested-callbacks': ['error', { max: 6 }],
  'unicorn/new-for-builtins': 'error', // It is similar to `no-new-wrappers`, prefer unicorn/new-for-builtins here.
  'no-case-declarations': 'error',
  'no-constructor-return': 'error',
  'typescript/no-deprecated': 'error',
  'no-fallthrough': 'error',
  'unicorn/no-immediate-mutation': 'error',
  'no-loop-func': 'error',
  'typescript/no-misused-promises': 'error',
  'typescript/no-mixed-enums': 'error',
  'unicorn/no-new-buffer': 'error',
  'no-object-constructor': 'error',
  'no-promise-executor-return': 'error',
  'no-self-compare': 'error',
  'no-throw-literal': 'error',
  'no-unnecessary-array-flat-depth': 'error',
  'typescript/only-throw-error': 'error',
  'prefer-array-some': 'error',
  'prefer-code-point': 'error',
  'typescript/prefer-enum-initializers': 'error',
  'unicorn/prefer-event-target': 'error',
  'typescript/prefer-nullish-coalescing': 'error',
  'typescript/prefer-promise-reject-errors': 'error',
  'typescript/require-await': 'error',
  'require-unicode-regexp': 'error',
  'typescript/return-await': ['error', 'never'],

  // Rules are reported as `warn`. Most of them are fixable, mainly about readability and style.
  'unicorn/no-hex-escape': 'warn',
  'unicorn/no-typeof-undefined': 'warn',
  'unicorn/no-unnecessary-array-splice-count': 'warn',
  'unicorn/no-unnecessary-slice-end': 'warn',
  'unicorn/no-instanceof-array': 'warn',
  'no-else-return': 'warn',
  'typescript/ban-ts-comment': 'warn', // replace typescript/prefer-ts-expect-error
  'typescript/no-confusing-void-expression': 'warn',
  'unicorn/escape-case': 'warn',
  'unicorn/explicit-length-check': 'warn',
  'no-array-constructor': 'warn',
  'unicorn/no-useless-promise-resolve-reject': 'warn',
  'no-useless-undefined': 'warn',
  'prefer-date-now': 'warn',
  'prefer-import-meta-properties': 'warn',
  'prefer-includes': 'warn',
  'prefer-math-min-max': 'warn',
  'unicorn/prefer-prototype-methods': 'warn',
  'unicorn/prefer-regexp-test': 'warn',
  'unicorn/prefer-string-replace-all': 'warn',
  'unicorn/prefer-string-slice': 'warn',
  'prefer-type-error': 'warn',
  'unicorn/require-number-to-fixed-digits-argument': 'warn',

  'typescript/strict-void-return': 'warn',
  'unicorn/prefer-native-coercion-functions': 'warn',
  'unicorn/prefer-array-flat': 'warn',
  'eslint/no-useless-return': 'warn',
  'unicorn/no-useless-switch-case': 'warn',
  'no-lonely-if': 'warn',
  'unicorn/no-negation-in-equality-check': 'warn',
  'no-negated-condition': 'warn'
}

export const lintBase: OxlintConfig = {
  categories: {
    correctness: 'error',
    perf: 'error',
    suspicious: 'error',
    nursery: 'error',

    // White list mode
    restriction: 'off',
    pedantic: 'off',
    style: 'off'
  },
  plugins: ['eslint', 'oxc', 'import', 'promise', 'typescript', 'unicorn'],
  rules: {
    ...nursery,

    ...restriction,
    ...pedantic,
    'typescript/no-unsafe-type-assertion': 'off'
  },
  options: {
    typeAware: true,
    typeCheck: true,
    denyWarnings: true,
    reportUnusedDisableDirectives: 'warn',
    // We hope to use `oxlint-disable-next-line` instead of `eslint-xxx`
    respectEslintDisableDirectives: false
  },
  overrides: [
    // Test override, can be used for all catelogries
    {
      env: {
        node: true,
        // We do not use jest
        vitest: true
      },
      files: ['*.test.ts', '*.spec.ts']
    },
    {
      rules: {
        'import/no-default-export': 'off'
      },
      files: ['*.config.ts']
    }
  ]
}
