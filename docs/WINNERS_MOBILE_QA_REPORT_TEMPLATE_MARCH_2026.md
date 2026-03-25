# Winners Mobile QA Report Template

Updated: March 24, 2026
Scope: `mobile/WinnersApp`
Use after: physical-device QA pass following `WINNERS_MOBILE_DEVICE_QA_RUNBOOK_MARCH_2026.md`

## Report Summary

- Test date:
- Tester:
- App build:
- Devices tested:
- OS versions:
- Network conditions:

## Critical Issues (must fix before production)

1. [Issue] - [Screen] - [Device] - [Reproduction steps]
2. [Issue] - [Screen] - [Device] - [Reproduction steps]
3. [Issue] - [Screen] - [Device] - [Reproduction steps]

## Visual Issues (fix before submission)

1. [Issue] - [Screen] - [Screenshot]
2. [Issue] - [Screen] - [Screenshot]
3. [Issue] - [Screen] - [Screenshot]

## Accessibility Issues

1. [Issue] - [Screen] - [TalkBack/Large Text]
2. [Issue] - [Screen] - [TalkBack/Large Text]
3. [Issue] - [Screen] - [TalkBack/Large Text]

## Passed

[X] flows passed out of [Y] total

## Next Engineering Pass

Based on failures, these backend integrations need completing:

- `src/stores/aiStore.ts` still uses local assistant conversations and generated replies; replace with real ARIA, NOVA, SAGE, ATLAS, and OMEGA backend calls.
- `src/stores/communityStore.ts` still serves feed, comments, groups, and member profiles from local Zustand data; replace with live community endpoints and realtime updates.
- `src/stores/academyStore.ts` still serves course catalog, lesson metadata, downloads, and notes from local state; replace with real Academy catalog, progress, and certificate endpoints.
- `src/stores/marketStore.ts` still serves products, cart, wishlist, and checkout state from local data; replace with real catalog, cart, order, vendor, and payment backend flows.
- `src/stores/workStore.ts` still serves jobs, applications, contracts, and freelancer profiles from local data; replace with real jobs, proposals, contracts, and escrow endpoints.
- `src/stores/appShellStore.ts` still serves notifications and messages from local data; replace with real notifications inbox, read-state sync, and messaging APIs.

---

## After QA - Next Engineering Pass

Once QA report is written, the priority order for production integration is:

1. Any crash -> fix immediately before anything else
2. Auth flows broken -> block all other testing
3. OMEGA briefing not personalised -> replace mock with real `omegaRoutes.ts` call
4. Community feed showing cached/demo data -> wire real `postRoutes.ts`
5. ARIA chat not streaming -> verify SSE connection to Railway
6. Stripe checkout not completing -> wire real `stripeRoutes.ts`
7. Push notifications not arriving -> verify Firebase FCM token registration

## Current Mobile Mock-to-Production Map

- OMEGA / ARIA / assistant chat:
  `mobile/WinnersApp/src/stores/aiStore.ts`
- Community feed, post detail, groups, and user profiles:
  `mobile/WinnersApp/src/stores/communityStore.ts`
- Academy catalog, progress, and lesson metadata:
  `mobile/WinnersApp/src/stores/academyStore.ts`
- Market catalog, cart, and checkout scaffolding:
  `mobile/WinnersApp/src/stores/marketStore.ts`
- Work jobs, contracts, applications, and freelancer profiles:
  `mobile/WinnersApp/src/stores/workStore.ts`
- Notifications and messages modal data:
  `mobile/WinnersApp/src/stores/appShellStore.ts`
- Auth fallback demo session still exists:
  `mobile/WinnersApp/src/stores/authStore.ts`

## How To Use This Report

1. Run the device pass from `WINNERS_MOBILE_DEVICE_QA_RUNBOOK_MARCH_2026.md`.
2. Fill the issue sections with real device findings, not simulator-only behavior.
3. If a failure maps to a local store-backed surface, move it into the corresponding integration item above.
4. Treat any crash, auth blocker, or payment blocker as release-blocking.
