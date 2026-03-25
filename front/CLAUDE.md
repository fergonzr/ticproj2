# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This is a monorepo. The mobile app lives in `front/`. Backend services are in `back/`. All commands below should be run from `front/`.

## Commands

```bash
# Install dependencies
npm install

# Start dev server (Expo)
npx expo start

# Run on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web

# Lint
npx expo lint

# Generate API docs (TypeDoc)
npx typedoc
```

There is no separate build step or test runner configured — the single test file (`lib/components/PersonSelector.test.tsx`) exists but no test script is set up in `package.json`.

## Architecture Overview

### Navigation

File-based routing via **Expo Router**. The root layout (`app/_layout.tsx`) sets up a **Drawer** navigator with three sub-navigators:

- `app/Main.tsx` — citizen home screen with the emergency button
- `app/(medical)/` — Stack: list and create/edit medical profiles
- `app/(paramedic)/` — Stack: paramedic login, emergency browser, case report
- `app/AboutUs.tsx`, `app/PQRS.tsx` — standalone drawer screens
- `app/index.tsx` — redirects to `Main`

### State Management

Pure React Context + hooks; no Redux. Three main contexts:

| Context | File | Purpose |
|---|---|---|
| `ApiContext` | `lib/api/useApi.tsx` | Provides all backend interfaces |
| `MedicalInfoContext` | `lib/hooks/useMedicalInfo.tsx` | CRUD for up to 4 stored persons (encrypted via `expo-secure-store`) |
| `ActiveEmergencyContext` | `app/(paramedic)/_layout.tsx` | Paramedic workflow state |

### API Layer

All backend communication is **interface-driven** (`lib/api/interfaces.ts`). Currently the entire layer is mocked (`lib/api/mock.ts`). To integrate a real backend, implement the interfaces and swap the mock out in `ApiContext`. Key interfaces:

- `EmergencyUpdateListener` — citizen reports + status polling
- `ParamedicAuthenticator` / `EmergencyAssignmentListener` — paramedic session
- `CaseReportSubmitter` — triage/report submission
- `RouteProvider` / `ParamedicLocationTracker` — maps and GPS

### Theming & Styling

Two systems work together:

- **RNEUI** (`@rneui/themed`) for component-level theming — configured in `lib/themes/theme.ts`
- **NativeWind** (TailwindCSS) for utility classes — palette defined in `tailwind.config.js`

Centralised tokens:
- `lib/themes/Colors.ts` — named color palette (24 entries)
- `lib/themes/Spacing.ts` — xs / sm / md / lg / xl / xxl scale

All user-visible strings live in `lib/strings.ts`.

### Domain Models

`lib/models.ts` holds all TypeScript types and enums shared across the app (e.g., `EmergencyStatus`, `PersonInfo`, `CaseReport`).

### Key Reusable Hooks & Utilities

- `lib/hooks/useEmergencyStatus.ts` — handles status color animation, haptic feedback, and push notifications on status change
- `lib/hooks/useParamedicLocationTracking.tsx` — continuous GPS reporting for paramedics
- `lib/utils/location.ts` — one-shot `getCurrentLocation()` with 15 s timeout
- `lib/map/leafletHtml.ts` — self-contained HTML injected into `WebView` for Leaflet maps

## TypeScript

Strict mode is enabled. Path alias `@/*` maps to the `front/` root (configured in `tsconfig.json` and `babel.config.js`).

## Code Conventions

### Components & Screens

- Use **function declarations** with a **default export**: `export default function MyScreen(): ReactElement { ... }`
- Always annotate the return type as `ReactElement`
- Define a `Props` interface at the top of the file for any component that accepts props
- Form-local types (e.g., `type PQRSForm`) and their `EMPTY_X` constants live at the top of the same file, not in `models.ts`
- Shared domain types go in `lib/models.ts`

### Naming

| Kind | Convention | Example |
|---|---|---|
| Files & components | PascalCase | `EmergencyBtn.tsx` |
| Hooks | camelCase + `use` prefix | `useEmergencyStatus` |
| Functions & handlers | camelCase | `handleSave`, `validateForm` |
| Constants | UPPER_SNAKE_CASE | `MAX_REGISTERED_PERSONS`, `EMPTY_FORM` |
| Types & interfaces | PascalCase | `MedicalInfo`, `CaseReport` |
| Enum members | UPPER_SNAKE_CASE | `EmergencyStatus.RECEIVED` |

### Styling

Three tools are used together — pick the right one per context:

- **NativeWind `className`** — layout, flex, spacing, basic typography (`className="flex-row items-center gap-4"`)
- **`StyleSheet`** — component-level styles that reference `colors` or `spacing` tokens, or require conditional/dynamic values
- **Inline `style` prop** — only for truly dynamic values (e.g., a computed color, safe-area `paddingTop`)

`colors` from `lib/themes/Colors.ts` and `spacing` from `lib/themes/Spacing.ts` are used exclusively inside `StyleSheet` definitions, not in NativeWind classes.

### Strings

Every user-visible string must come from `lib/strings.ts`. Import it as a namespace:

```ts
import * as str from "@/lib/strings";
```

No hardcoded copy in component files. All text is in Spanish (target audience is Colombian).

### Validation

Validation functions are standalone, co-located at the top of the screen file, and return `string | null` (an error message from `strings.ts`, or `null` on success):

```ts
function validateForm(form: MyForm): string | null { ... }
```

Errors are surfaced with `Alert.alert()`.

### Context & Hooks

- Contexts are always wrapped in a custom hook — components never call `useContext` directly
- Each context file exports both the Provider component and the hook (e.g., `MedicalInfoProvider` + `useMedicalInfo`)
- Hooks return explicit type annotations

### Navigation

- Use `useRouter` from `expo-router` for programmatic navigation
- Type route params with generics: `useLocalSearchParams<{ index?: string }>()`
- Parse complex params manually: `JSON.parse(params.emergencyCase) as EmergencyCase`
