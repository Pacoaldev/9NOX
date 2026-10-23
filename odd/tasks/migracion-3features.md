# Feature: Migracion 3 Features (Currency, Check-All Models, Usage UX)
Branch: feature/migracion-3features
Delivery: Work-unit commits per feature slice with Next.js build verification

## Specs
- S1: "Settings → Currency multi-divisa"
  Allow selecting display currency in Settings (persisted to settings API / store), format costs across Usage dashboard (OverviewCards, UsageTable, TopModelsChart) using Intl.NumberFormat with base USD rates, and support i18n for currency labels.
- S2: "Botón 'Check All (active) models' por provider"
  Add batch model testing for active models in provider detail view with bounded concurrency (4-6), progress indicator, cancel support, and status updates per model row.
- S3: "UX de Usage & Analytics"
  Reorganize Usage dashboard with section/tab navigation (Overview, Providers, Models, Limits, Requests) using SegmentedControl, consistent loading skeletons and error feedback, and integrated provider limits.
- S4: "recuerda que esto va a una imagen de Docker con la que trabajamos posteriormente entendido?"
  Ensure all implementations pass lint/compilation checks and `npm run build` succeeds so the Dockerfile / docker-compose.dev.yml image builds and runs without defects.

## Tasks
- [x] T1: Implement Currency constants, settings persistence, useCurrency hook, and cost formatting in Usage dashboard (S1) [inline] (tests: tests/unit/currency.test.js pass 4/4)
- [ ] T2: Implement batch model test API and "Check All active models" UI with progress and cancellation (S2) [inline]
- [ ] T3: Reorganize Usage & Analytics UX into tabbed sections with consistent loading and error states (S3) [inline]
- [ ] T4: Validate compilation with `npm run build` for Docker compatibility and check regressions (S4) [inline]

## Log
- L1: 2026-10-23T19:01:03+02:00 User: "Hay que implementar las 3 features, recuerda que esto va a una imagen de Docker con la que trabajamos posteriormente entendido?"
