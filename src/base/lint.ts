import type { DummyRuleMap, OxlintConfig } from 'vite-plus/lint'

import { cliOverride } from '../shared/lint.ts'

// Rules Config
const suspicious: DummyRuleMap = {
  'no-shadow': 'off',
  'typescript/no-unsafe-type-assertion': 'off'
}

const perf: DummyRuleMap = {
  'no-await-in-loop': 'off'
}

const nursery: DummyRuleMap = {
  // We hope typescript can process them.
  'no-undef': 'off',
  'import/named': 'off',

  // Disable some too strict ones
  'no-restricted-exports': 'off'
}

// Whitelist mode
const style: DummyRuleMap = {
  'arrow-body-style': 'warn',
  'capitalized-comments': 'warn',
  curly: 'warn',
  'default-case-last': 'warn',
  'default-param-last': 'warn',
  'func-name-matching': 'warn',
  'func-names': ['warn', 'never'],
  'func-style': 'off',
  'grouped-accessor-pairs': 'warn',
  'guard-for-in': 'warn',
  'id-length': 'off',
  'id-match': 'warn',
  'import/consistent-type-specifier-style': 'warn',
  'import/exports-last': 'off',
  'import/first': 'warn',
  'import/group-exports': 'off',
  'import/newline-after-import': 'warn',
  'import/no-anonymous-default-export': 'off',
  'import/no-duplicates': 'warn',
  'import/no-mutable-exports': 'warn',
  'import/no-named-default': 'warn',
  'import/no-named-export': 'off',
  'import/no-namespace': 'off',
  'import/no-nodejs-modules': 'off',
  'import/prefer-default-export': 'off',
  'init-declarations': 'off',
  'logical-assignment-operators': 'warn',
  'max-params': 'off',
  'max-statements': 'off',
  'new-cap': 'off',
  'no-continue': 'off',
  'no-duplicate-imports': ['warn', { allowSeparateTypeImports: true }],
  'no-extra-label': 'warn',
  'no-implicit-coercion': 'warn',
  'no-label-var': 'warn',
  'no-labels': 'warn',
  'no-lone-blocks': 'warn',
  'no-magic-numbers': 'off',
  'no-multi-assign': 'warn',
  'no-multi-str': 'warn',
  'no-nested-ternary': 'off',
  'no-new-func': 'warn',
  'no-return-assign': 'warn',
  'no-script-url': 'warn',
  'no-template-curly-in-string': 'off',
  'no-ternary': 'off',
  'no-useless-computed-key': 'warn',
  'object-shorthand': 'warn',
  'operator-assignment': 'warn',
  'prefer-arrow-callback': 'warn',
  'prefer-const': 'warn',
  'prefer-destructuring': 'warn',
  'prefer-exponentiation-operator': 'warn',
  'prefer-named-capture-group': 'off',
  'prefer-numeric-literals': 'warn',
  'prefer-object-has-own': 'warn',
  'prefer-object-spread': 'warn',
  'prefer-promise-reject-errors': 'warn',
  'prefer-regex-literals': 'warn',
  'prefer-rest-params': 'warn',
  'prefer-spread': 'warn',
  'prefer-template': 'warn',
  'promise/avoid-new': 'off',
  'promise/no-nesting': 'warn',
  'promise/no-return-wrap': 'warn',
  'promise/param-names': 'warn',
  'promise/prefer-await-to-callbacks': 'warn',
  'promise/prefer-await-to-then': 'off',
  'promise/prefer-catch': 'warn',
  'sort-imports': 'off',
  'sort-keys': 'off',
  'typescript/adjacent-overload-signatures': 'warn',
  'typescript/array-type': 'warn',
  'typescript/ban-tslint-comment': 'warn',
  'typescript/class-literal-property-style': 'warn',
  'typescript/consistent-generic-constructors': 'warn',
  'typescript/consistent-indexed-object-style': ['warn', 'record'],
  'typescript/consistent-type-assertions': 'warn',
  'typescript/consistent-type-definitions': ['warn', 'interface'],
  'typescript/consistent-type-exports': 'warn',
  'typescript/consistent-type-imports': 'warn',
  'typescript/dot-notation': 'warn',
  'typescript/method-signature-style': ['warn', 'property'],
  'typescript/no-empty-interface': 'warn',
  'typescript/no-inferrable-types': 'warn',
  'typescript/no-unnecessary-qualifier': 'warn',
  'typescript/parameter-properties': 'warn',
  'typescript/prefer-find': 'warn',
  'typescript/prefer-for-of': 'warn',
  'typescript/prefer-function-type': 'warn',
  'typescript/prefer-readonly': 'warn',
  'typescript/prefer-reduce-type-parameter': 'warn',
  'typescript/prefer-regexp-exec': 'warn',
  'typescript/prefer-return-this-type': 'warn',
  'typescript/prefer-string-starts-ends-with': 'warn',
  'typescript/unified-signatures': 'warn',
  'unicorn/catch-error-name': 'warn',
  'unicorn/consistent-date-clone': 'warn',
  'unicorn/consistent-existence-index-check': 'warn',
  'unicorn/consistent-template-literal-escape': 'warn',
  'unicorn/custom-error-definition': 'warn',
  'unicorn/empty-brace-spaces': 'warn',
  'unicorn/error-message': 'warn',
  'unicorn/filename-case': 'warn',
  'unicorn/no-array-method-this-argument': 'warn',
  'unicorn/no-await-expression-member': 'off',
  'unicorn/no-console-spaces': 'warn',
  'unicorn/no-nested-ternary': 'off',
  'unicorn/no-null': 'off',
  'unicorn/no-unreadable-array-destructuring': 'warn',
  'unicorn/no-useless-collection-argument': 'warn',
  'unicorn/no-zero-fractions': 'warn',
  'unicorn/number-literal-case': 'warn',
  'unicorn/numeric-separators-style': 'warn',
  'unicorn/prefer-array-index-of': 'warn',
  'unicorn/prefer-bigint-literals': 'warn',
  'unicorn/prefer-class-fields': 'warn',
  'unicorn/prefer-classlist-toggle': 'warn',
  'unicorn/prefer-default-parameters': 'warn',
  'unicorn/prefer-dom-node-text-content': 'warn',
  'unicorn/prefer-export-from': 'warn',
  'unicorn/prefer-global-this': 'warn',
  'unicorn/prefer-includes': 'warn',
  'unicorn/prefer-keyboard-event-key': 'warn',
  'unicorn/prefer-logical-operator-over-ternary': 'warn',
  'unicorn/prefer-modern-dom-apis': 'warn',
  'unicorn/prefer-negative-index': 'warn',
  'unicorn/prefer-object-from-entries': 'warn',
  'unicorn/prefer-optional-catch-binding': 'warn',
  'unicorn/prefer-reflect-apply': 'warn',
  'unicorn/prefer-response-static-json': 'warn',
  'unicorn/prefer-spread': 'warn',
  'unicorn/prefer-string-raw': 'warn',
  'unicorn/prefer-string-trim-start-end': 'warn',
  'unicorn/prefer-structured-clone': 'warn',
  'unicorn/prefer-ternary': ['warn', 'only-single-line'],
  'unicorn/relative-url-style': 'warn',
  'unicorn/require-array-join-separator': 'warn',
  'unicorn/require-module-attributes': 'warn',
  'unicorn/switch-case-braces': 'warn',
  'unicorn/switch-case-break-position': 'warn',
  'unicorn/text-encoding-identifier-case': 'warn',
  'unicorn/throw-new-error': 'warn',
  'vars-on-top': 'warn',
  yoda: 'warn'
}

// Whitelist mode
const restriction: DummyRuleMap = {
  'oxc/bad-bitwise-operator': 'error',
  'class-methods-use-this': 'error',
  'default-case': 'error',
  'import/extensions': ['error', 'always', { checkTypeImports: true, ignorePackages: true }],
  'unicorn/no-abusive-eslint-disable': 'error',
  'no-alert': 'error',
  'import/no-amd': 'error',
  'no-array-reduce': 'error',
  'unicorn/prefer-module': 'error',
  'no-console': 'error',
  'import/no-cycle': 'error',
  'oxc/no-const-enum': 'error',
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
  'typescript/return-await': ['error', 'never'],

  // Rules are reported as `warn`. Most of them are fixable, mainly about readability and style.
  'unicorn/no-hex-escape': 'warn',
  'unicorn/no-typeof-undefined': 'warn',
  'unicorn/no-unnecessary-array-splice-count': 'warn',
  'unicorn/no-unnecessary-slice-end': 'warn',
  'unicorn/no-instanceof-array': 'warn',
  'no-else-return': 'warn',
  'typescript/ban-ts-comment': 'warn', // Replace typescript/prefer-ts-expect-error
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

    // Whitelist mode
    style: 'off',
    restriction: 'off',
    pedantic: 'off'
  },
  jsPlugins: [
    {
      name: 'liangmi',
      specifier: '@liangmi/vp-config/oxlint-plugin'
    }
  ],
  plugins: ['eslint', 'oxc', 'import', 'promise', 'typescript', 'unicorn'],
  rules: {
    // Enable all `correctness` config
    ...suspicious,
    ...nursery,
    ...perf,

    ...restriction,
    ...pedantic,
    ...style,

    // `liangmi` plugin
    'liangmi/no-orphan-vite-config': 'error',
    'liangmi/no-useless-vp-preset-imports': 'error',
    'liangmi/use-preset-vp-config': 'error',
    'liangmi/load-proper-vp-config-category': 'error',
    'liangmi/no-mixed-project': 'error'
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
      plugins: ['vitest'],
      rules: {
        // Style
        'vitest/consistent-test-filename': ['warn', { pattern: '.*.test.ts$' }],
        'vitest/consistent-test-it': ['warn', { fn: 'it', withinDescribe: 'it' }],

        'vitest/no-hooks': 'off',
        'vitest/require-top-level-describe': 'off',
        'vitest/prefer-strict-boolean-matchers': 'off',
        'vitest/max-expects': 'off',
        'vitest/prefer-expect-assertions': 'off',
        'vitest/prefer-importing-vitest-globals': 'off', // Conflict with `vite-plus/test`
        'vitest/no-importing-vitest-globals': 'off',
        'vitest/no-large-snapshots': 'off',
        'vitest/no-restricted-matchers': 'off',
        'vitest/no-restricted-vi-methods': 'off'
      },
      files: ['*.test.ts', '*.spec.ts']
    },
    {
      files: ['./scripts/**', './script/**', './*.ts', './*.js'],
      ...cliOverride
    },
    {
      rules: {
        'import/no-default-export': 'off',
        'no-console': 'error'
      },
      files: ['*.config.ts']
    }
  ]
}
