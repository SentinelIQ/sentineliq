# 🚀 Quick Reference - CI/CD & Development

## 📝 Commit Messages

### Using Commitizen (Recommended)
```bash
npm run commit
```

### Manual Format
```bash
git commit -m "type(scope): subject"

# Examples:
git commit -m "feat(auth): add 2FA support"
git commit -m "fix(payment): correct webhook validation"
git commit -m "docs(api): update authentication guide"
```

### Common Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Tests
- `build` - Build system
- `ci` - CI/CD changes
- `chore` - Maintenance

## 🏷️ Releases

### Create Release (GitHub Actions)
1. Go to **Actions** → **Release - Semantic Versioning**
2. Click **Run workflow**
3. Select release type: `patch`, `minor`, `major`, or `prerelease`
4. Click **Run workflow**

### Create Release (Local)
```bash
# Auto-detect version bump
npm run release

# Specific version bump
npm run release:patch   # 1.0.0 → 1.0.1 (bug fixes)
npm run release:minor   # 1.0.0 → 1.1.0 (new features)
npm run release:major   # 1.0.0 → 2.0.0 (breaking changes)

# Dry run (test without creating)
npm run release:dry
```

## 🔄 Development Workflow

### 1. Start Development
```bash
# Clone and setup
git clone <repo-url>
cd sentineliq
npm install

# Start infrastructure
docker-compose up -d

# Start database
wasp start db

# Run migrations
wasp db migrate-dev

# Start dev server
wasp start
```

### 2. Create Branch
```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-bug
```

### 3. Make Changes
```bash
# Edit files
# Test locally
wasp start
```

### 4. Commit
```bash
git add .
npm run commit  # Interactive commit
```

### 5. Push & PR
```bash
git push origin feature/my-feature
# Create PR on GitHub
```

## 🧪 Testing & Quality

```bash
# Lint check
npm run lint

# Lint fix
npm run lint:fix

# Run tests
npm test

# Validate Wasp
wasp validate

# Check module conformity
@copilot checkprod <module-name>
```

## 🚀 Deployment

### Staging (Automatic)
- Triggered on merge to `main`
- URL: https://staging.sentineliq.app

### Production (Automatic)
- Triggered on tag push (release)
- URL: https://sentineliq.app

### Manual Deploy
```bash
# Via GitHub Actions
Actions → CD - Continuous Deployment → Run workflow

# Select environment: staging or production
```

## 📦 Scripts

```bash
npm run commit              # Commitizen helper
npm run release             # Create release
npm run release:patch       # Patch release
npm run release:minor       # Minor release
npm run release:major       # Major release
npm run release:dry         # Dry run
npm run lint                # Check code style
npm run lint:fix            # Fix code style
```

## 🔍 Troubleshooting

### Commit Rejected
```bash
# Use Commitizen
npm run commit

# Or check format: type(scope): subject
```

### Lint Errors
```bash
npm run lint:fix
```

### Build Failed
```bash
wasp clean
wasp validate
wasp build
```

### Migration Issues
```bash
wasp db reset
wasp db migrate-dev
```

## 📚 Resources

- [Full CI/CD Guide](./docs/deploy/CI-CD-PIPELINE.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
- [Wasp Docs](https://wasp.sh/docs)

## 🆘 Getting Help

- Open an issue with `question` label
- Check existing documentation in `/docs`
- Ask in GitHub Discussions
