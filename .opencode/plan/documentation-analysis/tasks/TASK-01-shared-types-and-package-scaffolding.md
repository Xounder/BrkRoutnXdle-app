# Task 01 — Shared Types & Package Scaffolding

## Task Information

### ID

TASK-01

### Title

Shared Types & Package Scaffolding

### Owner

senior-backend

### Status

Pending

---

## Description

Create the foundational monorepo structure and shared type definitions that all other tasks depend on. This includes setting up the package workspaces, defining all shared TypeScript types/interfaces/constants, and scaffolding the package directories (`packages/shared`, `packages/domain`, `packages/calendar`, `packages/ui`).

---

## Acceptance Criteria

- [ ] Monorepo workspace configured with `pnpm` workspaces
- [ ] `packages/shared` created with all common types: `Task`, `BlockedSlot`, `Settings`, `CalendarEvent`, `User`, `ApiResponse<T>`, `ApiError`
- [ ] `packages/domain` scaffolded with empty entry point
- [ ] `packages/calendar` scaffolded with empty entry point
- [ ] `packages/ui` scaffolded with empty entry point
- [ ] `apps/web` and `apps/api` configured to consume packages via workspace references
- [ ] Shared constants defined: `SLOT_DURATION_MINUTES = 30`, `ALLOWED_DURATIONS`, `CACHE_TTL_MS`, `DEFAULT_SETTINGS`
- [ ] Shared enums/types defined: `Priority` (low, medium, high, critical), `BlockType` (single-day, recurring-weekday, recurring-period), `TaskRestriction`, `ViewType` (day, week, month), `CompletionStatus`
- [ ] Build scripts run successfully for all packages (`pnpm build`)
- [ ] TypeScript compilation passes without errors

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This is the foundational task. All other tasks depend on the types defined here.

---

## Technical Context

### Relevant Components

- `packages/shared/src/types/`
- `packages/shared/src/constants/`
- `packages/shared/src/index.ts`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`

### Relevant Modules

- `packages/shared`
- `packages/domain`
- `packages/calendar`
- `packages/ui`

### Relevant APIs

- N/A (foundational package)

### Relevant Types

- `Task`, `BlockedSlot`, `Settings`, `CalendarEvent`, `User`, `ApiResponse`, `ApiError`
- `Priority`, `BlockType`, `ViewType`, `CompletionStatus`

---

## Current Status

**Partially implemented**: Monorepo root files (`pnpm-workspace.yaml`, `tsconfig.base.json`, root `package.json`) exist. `packages/shared` has all types and constants complete (`types/index.ts`: 150 lines, `constants/index.ts`: 37 lines). `packages/domain` has scaffolded `package.json`/`tsconfig.json` but empty `src/index.ts`.

**Remaining scaffolding** (provided below): `packages/calendar`, `packages/ui`, `apps/api`, `apps/web` packages need creation. `packages/domain/src/index.ts` needs proper exports.

---

## Step-by-Step Implementation

### Step 1: Create `packages/calendar/package.json`

```json
{
  "name": "@brkroutnxdle/calendar",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@brkroutnxdle/shared": "workspace:*"
  }
}
```

Creates the calendar package manifest with a dependency on shared types only.

### Step 2: Create `packages/calendar/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

Configures TypeScript for the calendar package, extending the base config.

### Step 3: Create `packages/calendar/src/index.ts`

```ts
// Calendar package entry point
export {};
```

Placeholder entry point — will be populated in TASK-03.

### Step 4: Create `packages/ui/package.json`

```json
{
  "name": "@brkroutnxdle/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@brkroutnxdle/shared": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

Creates the UI package manifest with React as a peer dependency.

### Step 5: Create `packages/ui/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

Enables JSX support for React components in the UI package.

### Step 6: Create `packages/ui/src/index.ts`

```ts
// UI package entry point
export {};
```

Placeholder — will be populated in TASK-11.

### Step 7: Create `apps/api/package.json`

```json
{
  "name": "@brkroutnxdle/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@brkroutnxdle/shared": "workspace:*",
    "@brkroutnxdle/domain": "workspace:*",
    "@brkroutnxdle/calendar": "workspace:*",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "helmet": "^7.0.0",
    "googleapis": "^128.0.0",
    "zod": "^3.22.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.6",
    "@types/uuid": "^9.0.7",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
```

Creates the API package manifest with Express and all backend dependencies.

### Step 8: Create `apps/api/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### Step 9: Create `apps/api/src/index.ts`

```ts
// API entry point — will be expanded in TASK-02
console.log("BrkRoutnXdle API starting...");
```

Minimal entry point for initial scaffolding validation.

### Step 10: Create `apps/web/package.json`

```json
{
  "name": "@brkroutnxdle/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@brkroutnxdle/shared": "workspace:*",
    "@brkroutnxdle/domain": "workspace:*",
    "@brkroutnxdle/ui": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "@fullcalendar/react": "^6.1.0",
    "@fullcalendar/daygrid": "^6.1.0",
    "@fullcalendar/timegrid": "^6.1.0",
    "@fullcalendar/interaction": "^6.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "typescript": "^5.4.0"
  }
}
```

### Step 11: Create `apps/web/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"],
  "references": [
    { "path": "./tsconfig.node.json" }
  ]
}
```

### Steps 12–16: Web config files, domain index, and build verification

See continuation file: `references/TASK-01-impl-guide-part2.md`

These steps create `tsconfig.node.json`, `vite.config.ts`, `index.html` for the web app, and verify the build.

---

## Testing

### Unit Tests

- [ ] Verify that shared types can be imported by both `apps/web` and `apps/api`

### Integration Tests

- [ ] Verify that monorepo build produces working artifacts

### Manual Validation

- [ ] Verify `pnpm build` runs without errors
- [ ] Verify that all packages are present in `node_modules` after `pnpm install`

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Build passes
- [ ] Lint passes

---

## References

- `architecture/monorepo-structure.md` — Folder structure and dependency rules
- `architecture/package-contracts.md` — Package boundaries and visibility model
- `architecture/architecture.md` — Domain model, data model, localStorage structure
