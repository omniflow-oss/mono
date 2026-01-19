# OmniFlowCX Monorepo

A contracts-first monorepo for OmniFlowCX, featuring Quarkus backend services,
Nuxt frontend applications, and automated tooling.

## 🚀 Quick Start

### Prerequisites

- **Docker** (for local development environment)
- **pnpm** >= 9.15.0
- **Node.js** >= 20
- **Maven** >= 3.9
- **Java** >= 21 (for backend development)

### Installation

```bash
# Install dependencies
./mono bootstrap
```

### Development

```bash
# Start all changed services in watch mode
./mono dev --changed

# Start all services
./mono dev --all

# Start specific service
./mono dev --scope back/services/your-service
./mono dev --scope front/apps/your-app
```

### Quality Checks

```bash
# Run all checks for changed code
./mono check --changed

# Run specific checks
./mono lint --changed
./mono typecheck --changed
./mono test --changed
./mono build --changed
```

## 📁 Project Structure

```text
.
├── back/              # Quarkus backend services
│   ├── services/      # Individual microservices
│   └── libs/          # Shared Java libraries
├── front/             # Nuxt frontend applications
│   ├── apps/          # Frontend applications
│   └── packages/      # Shared TypeScript packages
├── contracts/         # OpenAPI contracts
│   ├── rest/          # REST API specifications
│   └── rules/         # Spectral linting rules
├── docs/              # Documentation
│   └── site/          # VitePress documentation site
├── tools/             # Development tooling
│   ├── mono.mjs       # Monorepo orchestration script
│   ├── scaffold/      # Code scaffolding templates
│   └── contracts/     # Contract generation tools
├── infra/             # Infrastructure configuration
│   └── tools.compose.yaml  # Docker compose for dev tools
├── reports/           # Generated reports (lint, test, build)
└── mono               # Main entry point script
```

## 🔧 Available Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `./mono bootstrap` | Install all dependencies |
| `./mono dev [flags]` | Start development servers |
| `./mono check [flags]` | Run all quality checks |
| `./mono lint [flags]` | Run linters |
| `./mono typecheck [flags]` | Run type checking |
| `./mono test [flags]` | Run tests |
| `./mono build [flags]` | Build all projects |

### Flags

| Flag | Description |
|------|-------------|
| `--scope <path>` | Run command for specific scope |
| `--changed` | Run only for changed files (default) |
| `--all` | Run for all scopes |
| `--dry-run` | Show what would run without executing |

### Scaffolding

| Command | Description |
|---------|-------------|
| `./mono new service <name>` | Create new Quarkus service |
| `./mono new app <name>` | Create new Nuxt app |
| `./mono new lib <name>` | Create new Java library |
| `./mono new package <name>` | Create new TypeScript package |
| `./mono delete service <name>` | Remove Quarkus service + contract + docs |
| `./mono delete app <name>` | Remove Nuxt app |
| `./mono delete lib <name>` | Remove Java library |
| `./mono delete package <name>` | Remove TypeScript package |

### Contracts

| Command | Description |
|---------|-------------|
| `./mono contracts lint` | Lint OpenAPI specs |
| `./mono contracts breaking` | Check for breaking changes |
| `./mono contracts build` | Bundle specs and generate clients |

### Documentation

| Command | Description |
|---------|-------------|
| `./mono docs:lint` | Lint documentation |
| `./mono docs:build` | Build documentation site |
| `./mono docs:serve` | Start docs dev server |

### Utilities

| Command | Description |
|---------|-------------|
| `./mono doctor` | Check development environment |
| `./mono list:ports` | List allocated ports |
| `./mono list:scopes` | List all scopes |

## 🛠️ Development Workflow

### 1. Start Development

```bash
# Start changed services
./mono dev --changed

# Start infrastructure (databases, message queues)
./mono infra up
```

### 2. Make Changes

```bash
# Format code
./mono fmt --changed

# Run linters
./mono lint --changed

# Run type checking
./mono typecheck --changed
```

### 3. Test Changes

```bash
# Run tests for changed code
./mono test --changed
```

### 4. Build Changes

```bash
# Build changed projects
./mono build --changed
```

### 5. Submit PR

```bash
# Run full check suite (required before PR)
./mono check --changed

# If contracts changed, check for breaking changes
./mono contracts breaking
```

## 📋 Pre-Commit Hooks

The monorepo uses husky + lint-staged for pre-commit checks:

- **Biome**: Format and lint JavaScript/TypeScript files
- **Spotless**: Format Java files
- **Spectral**: Lint OpenAPI specifications
- **Markdownlint**: Lint markdown files

These run automatically on `git commit`.

## 🎯 Code Quality Tools

### Linters

- **Biome**: JavaScript/TypeScript formatting and linting
- **Spotless**: Java formatting
- **Spotbugs**: Java static analysis
- **Spectral**: OpenAPI specification linting
- **Markdownlint**: Markdown linting

### Testing

- **Maven Surefire**: Java unit tests
- **Vitest**: JavaScript/TypeScript unit tests

### Type Checking

- **TypeScript**: Frontend type checking

## 🚢 Infrastructure

### Docker Compose

Development infrastructure runs in Docker containers:

```bash
# Start infrastructure
./mono infra up

# Stop infrastructure
./mono infra down
```

Services include:

- Development tools container
- Maven repository cache
- pnpm store cache

### Ports

- Frontend apps: `3001-3099`
- Backend services: `8081-8199`
- Java debug: `5005`

Use `./mono list:ports` to see allocated ports.

## 📚 Documentation

- **Project docs**: `/docs/site` - VitePress documentation
- **API docs**: Generated from OpenAPI contracts
- **Scaffolding**: See `CONTRIBUTING.md`

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

### Required Checks Before PR

1. `./mono check --changed`
2. `./mono contracts breaking` (if contracts changed)

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add user authentication
fix: resolve login bug
docs: update README
test: add unit tests for auth
refactor: simplify payment flow
```

## 🔍 Troubleshooting

### Common Issues

#### Port already in use

```bash
./mono doctor  # Check for port conflicts
```

#### Dependencies not installed

```bash
./mono bootstrap
```

#### Docker issues

Ensure Docker is installed and running, then re-run your command.

## 📖 Additional Resources

- [AGENTS.md](./AGENTS.md) - Agent guidelines
- [CODEOWNERS](./CODEOWNERS) - Code ownership rules
- [Taskfile.yml](./Taskfile.yml) - Task definitions

## 📄 License

[Add your license here]
