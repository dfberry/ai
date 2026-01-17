

# Copilot Instructions for the Monorepo

This file provides guidance for GitHub Copilot and other AI coding assistants to help maintainers and contributors work efficiently across the entire monorepo.

## Monorepo Management
- Use logical folder structure: `packages/`, `solutions/`, `.github/`, and others as needed.
- Use the workspace tools npm workspaces to manage dependencies across packages and solutions.
- Keep root-level configuration files (e.g., `.editorconfig`, `.gitignore`, `tsconfig.json`, `package.json`) up to date and consistent.
- Document any custom scripts or tooling in the root `README.md`.
- Use consistent naming conventions and folder organization for all subprojects.

## Managing the Packages Folder
- Each package should be self-contained, with its own `src/`, `dist/`, `test/` or `__tests__/`, `package.json`, and `README.md`.
- Use TypeScript for all new code. Set `declaration: true` in `tsconfig.json` to emit `.d.ts` files.
- The `main` field in `package.json` should point to the built JavaScript entry point (e.g., `dist/index.js`).
- The `types` field in `package.json` should point to the built type definitions (e.g., `dist/index.d.ts`).
- Do not commit build artifacts (`dist`) to version control.
- Export all public types, interfaces, and functions from `src/index.ts`.
- Document all exports and usage in the package's `README.md`.
- Use environment variables for secrets/configuration and never hardcode secrets.

## Managing the Solutions Folder
- Each solution should be self-contained, with its own `src/`, `public/`, `scripts/`, `test/` or `__tests__/`, `package.json`, and `README.md`.
- Solutions may depend on packages in the monorepo. Reference them using workspace protocol (e.g., `workspace:*` in dependencies).
- Follow the same TypeScript, build, and documentation standards as packages.
- Place all source code in `src/` and static assets in `public/`.
- Use scripts in the `scripts/` folder for automation or deployment.

## Devcontainer
- The `.devcontainer/` folder should contain configuration for VS Code Remote Containers.
- Ensure the devcontainer installs all required tools, extensions, and dependencies for local development.
- Document any custom setup steps in `.devcontainer/README.md` or the root `README.md`.
- Keep the devcontainer configuration up to date with project requirements.

## GitHub Actions
- Store all workflow files in `.github/workflows/`.
- Use GitHub Actions for CI/CD, linting, testing, and deployment.
- Keep workflows modular and reusable. Use composite actions or reusable workflows where possible.
- Document the purpose of each workflow in comments at the top of the YAML file.
- Use secrets and environment variables for sensitive data. Never hardcode secrets in workflow files.

## General Guidelines
- All code should be modular, reusable, and well-documented.
- Use TypeScript for all new code unless otherwise required. Ensure type definitions are generated and exported for consumers.
- Each package, solution, or project should have its own `README.md` with usage, API, and setup instructions.
- Keep dependencies up to date and scoped to each package or solution. Avoid unnecessary dependencies and duplication.
- Use `npm run build` (or the appropriate build command) to compile TypeScript to JavaScript and generate type declarations.
- Ensure all public APIs are type-safe and have clear, exported types.
- Write and run tests for all critical logic. Place tests in a `test` or `__tests__` folder within each package or solution.
- Use environment variables for secrets and configuration. Never hardcode secrets.
- Follow the repository's code style and linting rules. Run `npm run lint` if available.

## Environment
- Use `.env` files for local development secrets and configuration.
- Do not commit `.env` files or secrets to version control.
- Note: The `dotenv` package is not used. Instead, use Node's `--env-file` flag to load environment variables when running scripts (e.g., `node --env-file=.env ...`).

## Collaboration
- Write clear commit messages and PR descriptions.
- Keep changes focused and atomic.
- Update documentation and tests with code changes.
- Communicate breaking changes clearly in PRs and documentation.

---

_This file is intended to help AI coding assistants and developers maintain high quality and consistency across the entire monorepo._
