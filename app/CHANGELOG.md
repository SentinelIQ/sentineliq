# Changelog

All notable changes to SentinelIQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete CI/CD pipeline with GitHub Actions
- Semantic versioning with standard-version
- Conventional commits with commitizen and commitlint
- Automated changelog generation
- Husky git hooks for code quality
- PR and Issue templates
- Comprehensive CI/CD documentation
- Contributing guidelines

### Changed
- Updated development workflow to include semantic commits
- Enhanced code quality checks with lint-staged

---

## Release History

Future releases will be documented here automatically using semantic versioning.

### Release Types

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

### Commit Type to Version Mapping

- `feat:` commits → MINOR version bump
- `fix:` commits → PATCH version bump
- `BREAKING CHANGE:` → MAJOR version bump
- Other commit types → No version bump (included in next release)

---

For detailed commit history, see [GitHub Commits](https://github.com/sentineliq/app/commits)
