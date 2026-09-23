# SAAR Git Workflow

## Branch Strategy

```
main          ← production-ready code (protected, no direct push)
develop       ← integration branch (staging deploys from here)
feature/*     ← new features
fix/*         ← bug fixes
chore/*       ← maintenance, dependency updates, docs
hotfix/*      ← emergency production fixes
```

## Rules

| Rule | Detail |
|------|--------|
| No direct push to `main` | Branch protection enforced via GitHub |
| PR required | All changes via pull request |
| CI required | PR checks must pass before merge |
| Review required | At least 1 reviewer for `main` merges |
| No self-merge | For production-impacting changes |
| Migration review | DB migrations require explicit review note |

## Commit Convention

```
<type>(<scope>): <short description>

Types: feat, fix, chore, docs, refactor, test, ci, perf
Scopes: api, web, mobile, contracts, db, auth, infra

Examples:
feat(auth): add refresh token rotation
fix(api): handle prisma connection timeout
chore(deps): update @nestjs/* to 10.4.4
docs(adr): add ADR-002 auth strategy
```

## PR Checklist

- [ ] CI passes (lint, typecheck, tests, build)
- [ ] DB migrations tested on clean database
- [ ] Authorization tests cover owner/non-owner scenarios
- [ ] `.env.example` updated if new env vars added
- [ ] ADR created if architecture decision made
- [ ] No secrets in code or diffs

## Release Process

1. Feature branches merge to `develop`
2. `develop` deploys automatically to staging
3. Staging tested and approved
4. `develop` → PR → `main`
5. Production deploy requires manual approval in GitHub Actions
6. Tag release: `git tag v0.1.0 -m "Phase 1: Foundation"`
