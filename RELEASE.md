# Release guide

## Before tagging
- Use a clean checkout on main.
- Confirm bun install --frozen-lockfile, bun run lint, and bun run build succeed.
- Review changes and ensure .env files, API keys, credentials, build outputs, caches, logs, keystores, and signing files are not included.
- Create a version tag (example: git tag -a v1.0.0 -m 'Release v1.0.0' and git push origin v1.0.0).

## Release contents
- GitHub automatically creates source archives (.zip and .tar.gz) on release.
- Workflow packages windows-web.zip and SHA-256 checksum.
- Android debug APK is built/attached when SDK and Gradle succeed, or skipped cleanly if unavailable.

## Security and artifacts
- Keep .env* (except .env.example), node_modules/, dist/, build/, *.log, and keystores out of git and releases.

## Release checklist
- Version tag uses v*.
- Local lint/build pass.
- Verify attached files and checksums before publishing.
