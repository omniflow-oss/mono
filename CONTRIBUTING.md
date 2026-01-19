# Contributing

Thank you for your interest in contributing to OmniFlowCX! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Scaffolding](#scaffolding)
- [Contracts-first Development](#contracts-first-development)
- [Code Quality Standards](#code-quality-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Commit Convention](#commit-convention)

## Getting Started

### Prerequisites

- **Docker** (for local development environment)
- **pnpm** >= 9.15.0
- **Node.js** >= 20
- **Maven** >= 3.9
- **Java** >= 21 (for backend development)

### Initial Setup

```bash
# Install dependencies
./mono bootstrap

# Start infrastructure (optional, for local services)
./mono infra up

# Run development servers
./mono dev --changed
```

### IDE Setup

#### VS Code

Recommended extensions (see `.vscode/extensions.json`):
- Biome
- Java Extension Pack
- Vue Language Features
- GitLens
- Error Lens

Run `Install Recommended Extensions` from VS Code command palette.

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Write code following project conventions
- Format code (automatic on save)
- Run linting: `./mono lint --changed`
- Run tests: `./mono test --changed`

### 3. Commit Changes

Follow [Conventional Commits](#commit-convention):

```bash
git add .
git commit -m "feat: add user authentication"
```

Pre-commit hooks will run automatically and may reject commits with issues.

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub using the provided template.

## Scaffolding

### Creating New Projects

The monorepo provides scaffolding for new services, apps, libraries, and packages:

```bash
# New Quarkus service
./mono new service <name>

# New Nuxt app
./mono new app <name>

# New Java library
./mono new lib <name>

# New TypeScript package
./mono new package <name>
```

### Naming Conventions

- **Services**: `kebab-case` (e.g., `user-service`, `payment-service`)
- **Apps**: `kebab-case` (e.g., `dashboard`, `admin`)
- **Libraries**: `kebab-case` (e.g., `shared-utils`, `common-types`)
- **Packages**: `kebab-case` (e.g., `api-clients`, `ui-components`)

## Contracts-first Development

We follow a contracts-first approach using OpenAPI specifications.

### Workflow

1. **Define Contract**: Create or update OpenAPI spec in `contracts/rest/`
2. **Lint Contract**: `./mono contracts lint`
3. **Check Breaking Changes**: `./mono contracts breaking`
4. **Build Contracts**: `./mono contracts build`
   - Bundles all specs
   - Generates TypeScript clients
   - Validates generated types
5. **Implement**: Use generated clients in frontend, implement in backend

### Contract Rules

- All REST APIs must have OpenAPI specs
- Specs must pass Spectral linting
- Breaking changes require major version bump
- Generate clients before implementing features

## Code Quality Standards

### Formatting

- **JavaScript/TypeScript**: Biome (automatic on save)
- **Java**: Google Java Format (Spotless)
- **Markdown**: Markdownlint (pre-commit)
- **YAML**: Spectral (pre-commit)

### Linting

All projects use configured linters:

- **Frontend**: Biome
- **Backend**: Spotless, Spotbugs
- **API Contracts**: Spectral

Run linters: `./mono lint --changed`

### Type Checking

- **Frontend**: TypeScript strict mode
- **Backend**: Java type system

Run type checking: `./mono typecheck --changed`

## Testing Guidelines

### Unit Tests

- Aim for high test coverage (>80%)
- Test public APIs thoroughly
- Mock external dependencies
- Follow AAA pattern (Arrange, Act, Assert)

### Integration Tests

- Test service interactions
- Use test databases/queues
- Clean up resources after tests

### E2E Tests

- Test critical user flows
- Run before releasing
- Document flaky tests

### Running Tests

```bash
# Run all tests for changed code
./mono test --changed

# Run specific test suite
./mono test --scope back/services/user-service

# Watch mode for TDD
./mono dev --scope front/apps/dashboard
```

### Coverage Reports

Coverage reports are generated in:
- `reports/jacoco/` (Java)
- `reports/vitest/` (TypeScript)

Target coverage: 80% across all metrics.

## Pull Request Process

### Before Submitting PR

1. **Run all checks**:
   ```bash
   ./mono check --changed
   ```

2. **Check contract changes** (if applicable):
   ```bash
   ./mono contracts breaking
   ```

3. **Update documentation** if needed

4. **Squash commits** if multiple (optional)

5. **Rebase** if branch is outdated:
   ```bash
   git fetch origin main
   git rebase origin/main
   ```

### PR Requirements

- [ ] All checks pass (lint, test, build)
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] PR description is complete

### Code Review

- Address all review comments
- Request changes from CODEOWNERS
- Maintain polite, constructive tone

### After Merge

- Delete your feature branch
- Celebrate! 🎉

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks
- `revert`: Revert previous commit

### Examples

```bash
feat(auth): add JWT token refresh

- Add refresh endpoint
- Implement token rotation
- Update docs

Closes #123
```

```bash
fix(api): resolve null pointer exception

The user service was failing when fetching
non-existent users. Added null check.

Fixes #456
```

```bash
chore(deps): update biome to 1.9.4

Latest version includes performance improvements.
```

## Troubleshooting

### Port Conflicts

```bash
./mono doctor
```

### Docker Issues

```bash
# Restart Docker containers
./mono infra down && ./mono infra up

# Or run without Docker
./mono --native <command>
```

### Build Failures

```bash
# Clean build artifacts
rm -rf reports/ back/target/ front/.nuxt/

# Try again
./mono build --changed
```

## Additional Resources

- [README.md](./README.md) - Project overview
- [AGENTS.md](./AGENTS.md) - Agent guidelines
- [CODEOWNERS](./CODEOWNERS) - Code ownership rules

## Getting Help

- Open an issue for bugs or questions
- Join our community discussions
- Check existing documentation first

Thank you for contributing! 🙏
