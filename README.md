# Connection Inspector

A comprehensive, mobile-friendly tool that displays detailed information about your connection, browser, device, and privacy exposure. Inspired by [`deviceinfo.me`](https://www.deviceinfo.me/) and powered by [`ipapi.is`](https://api.ipapi.is/).

## Tech Stack

- **Nuxt 3** with **TypeScript** (strict mode)
- **Vue 3** Composition API
- **Tailwind CSS** with shadcn-style design system
- **Vitest** for unit testing
- **Playwright** for E2E testing
- **ESLint + Prettier** for code quality

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
├── components/          # Vue components
│   └── ui/             # Reusable UI components
├── composables/        # Vue composables (reusable logic)
├── layouts/            # Nuxt layouts
├── pages/              # Nuxt pages
├── server/             # API routes (Nitro)
├── types/              # Centralized TypeScript types
├── utils/              # Utility functions
└── tests/              # Test files
    ├── unit/           # Unit tests for composables/utils
    ├── components/     # Component tests
    └── e2e/            # E2E tests
```

## Features

- **IP & Network**: IP detection, geolocation, ISP info, VPN/proxy detection
- **Browser Info**: Browser name/version, OS, screen details, WebGL GPU info
- **Privacy Analysis**: Canvas fingerprinting, audio fingerprinting, entropy scoring
- **Device Info**: Hardware concurrency, battery status, device orientation
- **Permissions**: Camera, microphone, geolocation, notification permissions
- **Real-time**: Battery level, mouse position, scroll tracking, connection status

## Pre-commit Hooks

This project uses Husky and lint-staged to ensure code quality. Before each commit:
- ESLint fixes any auto-fixable issues
- Prettier formats all supported files

## Deployment

Configured for Cloudflare Pages with `nitro.preset: 'cloudflare-pages'`.

## License

MIT

---

**Note**: All detection is performed client-side in your browser. No personal data is stored on any server.
