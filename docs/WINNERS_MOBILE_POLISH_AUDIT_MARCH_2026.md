# Winners Mobile Polish Audit

Updated: March 23, 2026
Scope: `mobile/WinnersApp`

## Accessibility

- Replaced the root auth/session spinner with tokenized skeleton loading in `src/navigation/RootNavigator.tsx`.
- Reduced-motion preference now disables shimmer animation in `src/components/ui/Skeleton.tsx`.
- Reduced-motion preference now disables onboarding card transitions in `src/screens/auth/OnboardingScreen.tsx`.
- Shell controls were normalized and cleaned in `src/components/navigation/MobileHeader.tsx` and `src/components/navigation/MobileTabBar.tsx`.
- `OfflineBanner`, `AssistantFAB`, and `VoiceInput` now expose explicit button semantics and hints.

## Offline

- `App.tsx` now restores the offline queue on launch.
- `App.tsx` now subscribes to `@react-native-community/netinfo` so offline state reflects actual connectivity instead of only failed requests.
- Queued offline actions automatically flush when connectivity returns and the queue is non-empty.
- Global offline status remains visible through `src/components/shared/OfflineBanner.tsx`.

## Performance

- Android bundle export passed with Hermes bundle size `3.9MB`, which is under the `< 8MB` target.
- Reduced-motion support lowers unnecessary animation work in loading and onboarding flows.
- Existing feed and market list virtualization remains in place via `FlatList`.
- A dev QA overlay now exposes launch timing, last measured navigation timing, route state, offline queue depth, and device memory.

## Remaining Device-Level Validation

- Cold start `< 3 seconds` still needs measurement on a representative Android 10 device.
- Screen transition `< 300ms` still needs device profiling.
- Sustained `60fps` scroll still needs on-device profiling with production data density.
- Cached-image `< 100ms` validation still needs measurement on hardware.
