# Winners Ecosystem Four-Document Architecture

Last updated: March 31, 2026

## Purpose

This document defines the canonical top-level product architecture for Winners Ecosystem. The product is organized around four primary documents, split across two realms:

- Admin Realm
- User Realm

These four documents are not just pages. They are the primary orientation surfaces through which every authenticated experience should be understood.

## The Two Realms

### Admin Realm

The Admin Realm is sovereign. It is available only to `SUPERADMIN` identities and must stay hidden from non-admin users.

It contains:

1. `Admin Dashboard`
Route: `/dashboard`

Responsibilities:
- Ecosystem-wide control tower
- Cross-platform analytics
- Platform launch control
- Tenant and user oversight
- FORGE intelligence
- Admin-only monitoring and intervention

2. `Core Engine Settings`
Route: `/settings/core`

Responsibilities:
- Master configuration for the ecosystem
- Global policies and defaults
- Cross-layer settings governance
- Experimental FORGE-managed settings intelligence

### User Realm

The User Realm is the everyday product surface for authenticated users.

It contains:

3. `User Home`
Route: `/home`

Responsibilities:
- OMEGA-led orientation dashboard
- Personal ecosystem entry point
- Smart resumption after absence
- Cross-layer context and next actions
- Layer status and what changed while away

4. `Settings`
Route: `/settings`

Responsibilities:
- Hierarchical settings entry point
- Core preferences first
- Layer settings second
- Platform-specific settings last
- User-controlled personalization and workspace management

## Canonical Model

```text
ADMIN REALM
  /dashboard       -> Admin Dashboard
  /settings/core   -> Core Engine Settings

USER REALM
  /home            -> User Home
  /settings        -> Settings
```

## Product Rules

### Routing rules

- `/` must resolve users into the correct realm entry point.
- Superadmins default to `/dashboard`.
- Non-admin authenticated users default to `/home`.
- `/settings/core` must always remain protected by superadmin-only access control.
- `/admin/settings` may exist as a compatibility alias, but `/settings/core` is the canonical route.
- `/admin/dashboard` may exist as a compatibility alias, but `/dashboard` is the canonical route.

### Navigation rules

- The four canonical documents must be visible in product navigation as a single conceptual group.
- User-facing navigation must make `/home` and `/settings` feel like the default pair.
- Admin-facing navigation must make `/dashboard` and `/settings/core` feel like the sovereign pair.
- Labels should prefer the canonical names:
  - `Admin Dashboard`
  - `Core Engine Settings` or `Core Settings`
  - `User Home`
  - `Settings`

### UX rules

- Each canonical document should reinforce the architecture by linking to the other three.
- The shell should clearly communicate whether the user is in the Admin Realm or User Realm.
- Settings should communicate hierarchy explicitly:
  - Core
  - Layer
  - Platform-specific

## Current Page Ownership

- `src/features/dashboard/DashboardPage.tsx`
  Owns the Admin Dashboard surface.
- `src/features/settings/CoreSettingsPage.tsx`
  Owns the Core Engine Settings surface.
- `src/features/home/UserHomePage.tsx`
  Owns the User Home surface.
- `src/features/settings/SettingsPage.tsx`
  Owns the Settings surface.

## Implementation Intent

The four-document model should become the mental model for the product shell:

- The shell explains the architecture.
- The routes enforce the architecture.
- The pages embody the architecture.
- Compatibility aliases support legacy links without weakening the canonical model.

## Success Criteria

The architecture is working when:

- New users can identify the main user entry point immediately.
- Superadmins can identify the sovereign control surfaces immediately.
- Settings no longer read as a flat page, but as a hierarchy.
- The product navigation mirrors the system overview without needing an external explanation.
