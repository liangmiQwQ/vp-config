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

  // Rules are reported as `warn`. Most of them are fixable, mainly about readability and style.
  'unicorn/no-hex-escape': 'warn',
  'unicorn/no-typeof-undefined': 'warn',
  'unicorn/no-unnecessary-array-splice-count': 'warn',
  'unicorn/no-unnecessary-slice-end': 'warn',
  'unicorn/no-instanceof-array': 'warn',
  'no-else-return': 'warn',
  'typescript/ban-ts-comment': 'warn',
  'typescript/no-confusing-void-expression': 'warn',
  'unicorn/escape-case': 'warn',
  'unicorn/explicit-length-check': 'warn',
  'no-array-constructor': 'warn',

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
    ...pedantic
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
    }
  ]
}
