# Repository Guidelines

## Project Structure & Module Organization

- `src/app`: Next.js App Router pages, layouts, and route handlers.
- `src/components`: Reusable UI and feature components (Radix-based UI lives under `src/components/ui`).
- `src/lib`: Client stores, utilities, and shared types.
- `public`: Static assets served as-is (images, icons, etc.).

## Build, Test, and Development Commands

- `npm run dev`: Start the local Next.js dev server at `http://localhost:3000`.
- `npm run build`: Create a production build.
- `npm run start`: Run the production server from `.next`.
- `npm run lint`: Run ESLint using `eslint.config.mjs`.
- `npm run format`: Format the repo with Prettier.
- `npm run format:check`: Verify formatting in CI or before PRs.
- `npm run format:staged`: Format only staged files (used by Husky pre-commit).
- `npm run test`: Run Playwright tests (auto-starts dev server).
- `npm run test:ui`: Launch Playwright UI mode for interactive debugging.

## Coding Style & Naming Conventions

- Language: TypeScript + React (Next.js 16, App Router).
- Indentation: 2 spaces in TS/TSX (follow existing files).
- Filenames: `PascalCase.tsx` for components, `kebab-case` for utility modules when appropriate.
- Imports: Prefer absolute aliases like `@/components/...` and `@/lib/...`.
- Formatting: Prettier with Tailwind class sorting via `.prettierrc.json`.
- Git hooks: Husky runs `lint-staged` on commit to format staged files.

## Testing Guidelines

- Framework: Playwright (`@playwright/test`) with config in `playwright.config.ts`.
- Install browsers once per machine: `npx playwright install`.
- Place tests in `tests/*.spec.ts` and keep names aligned with the feature.
- Use `BASE_URL=http://localhost:3000 npm run test` if you want to point at a pre-running server.

## Commit & Pull Request Guidelines

- Git history currently contains a single commit ("Initial commit from Create Next App"), so no formal convention is established yet.
- Recommended: use Conventional Commits (e.g., `feat(ui): add prompt gallery`) for new work.
- PRs should include: clear summary, linked issue (if any), and screenshots for UI changes.

## Configuration & Environment Notes

- Config files live at the repo root: `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`.
- Keep secrets out of the repo; use `.env.local` for local API keys and provider tokens.
