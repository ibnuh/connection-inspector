# Connection Inspector

A comprehensive, mobile-friendly tool that displays detailed information about your connection, browser, device, and privacy exposure. Inspired by [`deviceinfo.me`](https://www.deviceinfo.me/) and powered by [`ipapi.is`](https://api.ipapi.is/).

## Tech Stack

- **Nuxt 3** with **TypeScript** (strict mode)
- **Vue 3** Composition API with a shared `useInspector` provide/inject context
- **Tailwind CSS** with small shared UI primitives (`DataCard`, `DataRow`, `StatusBadge`)
- **Vitest** for unit testing
- **Playwright** for E2E testing
- **ESLint + Prettier** for code quality
- Deploy target: **Cloudflare Pages** (`nitro.preset: cloudflare-pages`)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Testing

```bash
# Run unit tests with Vitest (watch mode)
npm run test

# Run unit tests once
npm run test:run

# Run with coverage report
npm run test:coverage

# Run E2E tests with Playwright
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui
```

## Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Type check with TypeScript
npm run typecheck
```

## Project Structure

```
├── components/          # Vue components (overview + detail sections)
│   └── ui/              # Reusable UI primitives
├── composables/         # Detection logic + useInspector context
├── layouts/             # App chrome
├── pages/               # Routes (single home page)
├── server/              # Nitro API routes (edge helpers)
│   ├── api/
│   └── utils/
├── types/               # Shared TypeScript types
├── utils/               # Pure helpers (IP, exports)
└── tests/
    ├── unit/
    └── e2e/
```

## Features

- **IP and network**: IP detection, geolocation, ISP/ASN, risk scoring, reverse DNS, server-view compare
- **Browser info**: Browser name/version, OS, screen details, WebGL GPU info
- **Privacy analysis**: Canvas/audio fingerprinting, entropy-style privacy score, WebRTC ICE exposure
- **Connectivity probes**: Network Information API, WebSocket probe, best-effort IPv6 reachability
- **Device info**: Hardware concurrency, battery, orientation, preferences
- **Permissions**: Camera, microphone, geolocation, notification permissions (on demand)
- **Export**: JSON, CSV, Markdown, debug snippet
- **DNS resolvers**: Assisted resolver metadata (honestly labeled; not a full leak lab)

## Architecture notes

- `provideInspector()` on the home page creates one shared detection context.
- Section components call `useInspector()` instead of receiving dozens of props.
- Critical detection runs on mount; heavier probes (WebRTC, WebSocket, IPv6) are deferred via idle scheduling.
- Edge routes validate input and bound proxy payloads.

## Pre-commit Hooks

This project uses Husky and lint-staged. Before each commit:

- ESLint fixes auto-fixable issues
- Prettier formats supported files

## Deployment

Configured for Cloudflare Pages with `nitro.preset: 'cloudflare-pages'`.

## License

MIT

---

**Note**: Detection runs in your browser. Edge helpers only echo request metadata and proxy DNS lookups. No personal data is stored on the server.
