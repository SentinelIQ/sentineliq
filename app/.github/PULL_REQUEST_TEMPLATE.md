## 📝 Description

<!-- Provide a detailed description of your changes -->

## 🎯 Type of Change

<!-- Mark with an `x` all the checkboxes that apply -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Code style update (formatting, renaming)
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🏗️ Build configuration change
- [ ] 👷 CI/CD change
- [ ] 🔒 Security fix

## 🔗 Related Issues

<!-- Link to related issues, e.g., "Closes #123" or "Fixes #456" -->

Closes #

## 📋 Checklist

<!-- Mark with an `x` all the checkboxes that apply -->

### Code Quality

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors
- [ ] I have run `npm run lint:fix` and fixed all issues

### Testing

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested this in a local Wasp environment (`wasp start`)

### Documentation

- [ ] I have updated the documentation accordingly
- [ ] I have added/updated comments in the code
- [ ] I have updated the CHANGELOG if applicable

### Database & Configuration

- [ ] I have created necessary database migrations (`wasp db migrate-dev`)
- [ ] I have updated `main.wasp` if adding new operations/entities
- [ ] I have updated `schema.prisma` if modifying database schema
- [ ] All entities used in operations are listed in the `entities: []` array

### Security & Best Practices

- [ ] I have validated all user inputs with Zod schemas
- [ ] I have implemented proper workspace isolation (multi-tenancy)
- [ ] I have added audit logging for sensitive operations
- [ ] I have checked for SQL injection vulnerabilities
- [ ] I have implemented proper error handling

### Module Conformity (if applicable)

- [ ] Module passes `checkprod [module-name]` validation
- [ ] workspaceId isolation implemented
- [ ] enforcePlanLimit() integrated
- [ ] AuditLog integration complete
- [ ] Rate limiting configured

## 🧪 Testing Instructions

<!-- Provide step-by-step instructions on how to test your changes -->

1.
2.
3.


## 📸 Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->

## 🚀 Deployment Notes

<!-- Any special considerations for deployment? Database migrations? Environment variables? -->

## 💡 Additional Context

<!-- Add any other context about the PR here -->

---

## 🔍 Reviewer Notes

<!-- For reviewers - areas to focus on, potential concerns, etc. -->
