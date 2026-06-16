# TASK-01 Implementation Guide — Part 2

Continuation of scaffolding steps.

---

### Step 12: Create `apps/web/tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Provides TypeScript configuration for the Vite config file (separate from the app source).

### Step 13: Create `apps/web/vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

Configures Vite with the React plugin and proxies `/api` requests to the backend at port 3001.

### Step 14: Create `apps/web/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BrkRoutnXdle</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Standard Vite HTML entry point with root div and module script.

### Step 15: Update `packages/domain/src/index.ts`

Leave the current placeholder as-is:

```ts
// Domain package entry point
export {};
```

The actual `generateSchedule` export will be added in TASK-07.

### Step 16: Install dependencies and verify build

```powershell
pnpm install
pnpm build
```

Expected: all packages compile without errors. `pnpm build` exits with code 0.

---

## Files Created Summary

| File | Purpose |
|------|---------|
| `packages/calendar/package.json` | Calendar package manifest |
| `packages/calendar/tsconfig.json` | Calendar TypeScript config |
| `packages/calendar/src/index.ts` | Calendar entry point (placeholder) |
| `packages/ui/package.json` | UI package manifest |
| `packages/ui/tsconfig.json` | UI TypeScript config (jsx enabled) |
| `packages/ui/src/index.ts` | UI entry point (placeholder) |
| `apps/api/package.json` | API package manifest with Express + googleapis |
| `apps/api/tsconfig.json` | API TypeScript config |
| `apps/api/src/index.ts` | API entry point (minimal) |
| `apps/web/package.json` | Web package manifest with React + Vite |
| `apps/web/tsconfig.json` | Web TypeScript config |
| `apps/web/tsconfig.node.json` | Vite config TypeScript config |
| `apps/web/vite.config.ts` | Vite config with API proxy |
| `apps/web/index.html` | HTML entry point |
