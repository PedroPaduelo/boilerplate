/**
 * commitlint config (Conventional Commits).
 *
 * See: https://www.conventionalcommits.org/
 *
 * Rules used:
 * - type-enum: restricts the commit `type` to a small, well-known set
 *   (feat, fix, chore, docs, style, refactor, perf, test, build, ci,
 *   revert). The boilerplate uses these across its tasks; new projects
 *   can extend the list as needed.
 * - type-case: lower-case only.
 * - type-empty: forbids empty type.
 * - subject-empty: forbids empty subject.
 * - subject-full-stop: forbids trailing period.
 * - header-max-length: 100 chars max.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};
