# Winners Mobile Device QA Runbook

Updated: March 23, 2026
Scope: `mobile/WinnersApp`

## Goal

Validate the mobile layer on real devices for:

- cold start perception
- navigation responsiveness
- offline queue behavior
- accessibility at larger text sizes
- major journey completion across Community, Academy, Market, Work, AI, and root modals

After the run, record findings in:

- `docs/WINNERS_MOBILE_QA_REPORT_TEMPLATE_MARCH_2026.md`

## Recommended Test Devices

- Android 10 or newer with `2GB RAM` class hardware
- Android 13 or newer for modern notification and media behavior
- iPhone on iOS 14 or newer

## Build Modes

- Development QA overlay:
  `npx expo start`
- Android device build:
  `npx expo run:android`
- iOS device build:
  `npx expo run:ios`

The QA overlay appears automatically in dev builds. It can also be enabled in non-dev configs by setting Expo `extra.enableQaOverlay` to `true`.

## QA Overlay

The floating `QA` chip exposes:

- app launch time to first navigation readiness
- last measured navigation timing
- current leaf route
- online or offline state
- queued offline action count
- device model and total memory

Use it during test runs to capture quick timings without attaching profilers first.

## Core Test Script

### 1. Launch

- Force close the app.
- Relaunch from a cold state.
- Record perceived cold start with a stopwatch.
- Compare against QA overlay `Launch` metric.
- Target: under `3 seconds` on representative Android hardware.

### 2. Authentication

- Open login.
- Complete biometric path if available.
- Complete password path.
- Open register and forgot-password surfaces.
- Confirm touch targets remain comfortable at larger text settings.

### 3. Community

- Open feed and scroll several screens down.
- Pull to refresh.
- Open post detail.
- Create a post while online.
- Toggle airplane mode and create a post again to confirm queueing.
- Reconnect and verify the offline banner exposes queued sync and then clears.

### 4. Academy

- Open Academy home.
- Open course detail.
- Start course player.
- Toggle playback speed.
- Trigger offline queue action from lesson flow.
- Confirm download and offline affordances are announced correctly.

### 5. Market

- Browse product grid.
- Open product detail.
- Add product to cart.
- Proceed to checkout.
- Confirm navigation feels under `300ms` where possible using the QA overlay.

### 6. Work

- Open Work home.
- Open a job detail.
- Open application flow.
- Open contract detail.
- Open freelancer profile.

### 7. AI and Root Modals

- Open AI hub and at least one assistant chat.
- Open Profile, Settings, Notifications, and Messages modals from the shell.
- Toggle reduced motion and confirm onboarding or skeleton-heavy surfaces stop animating on next view.

## Accessibility Pass

- Enable larger text or display size on the device.
- Run VoiceOver on iOS and TalkBack on Android.
- Confirm:
  - header actions are announced clearly
  - bottom tabs announce selected state
  - offline banner sync action is reachable
  - forms expose labels and hints
  - notifications and messages remain readable at larger text sizes

## Offline Pass

- Enable airplane mode.
- Perform one queueable action in Community or Academy.
- Confirm the offline banner appears.
- Disable airplane mode.
- Confirm queued actions flush automatically or through the banner sync action.

## Performance Capture

- Note QA overlay `Launch` time after cold start.
- Note QA overlay `Last nav` after:
  - tab switch
  - modal open
  - job detail open
  - product detail open
- Record any route consistently above `300ms`.
- If scroll feels janky, profile on device with React Native performance tools before changing list code.

## Current Known Limits

- QA overlay timings are lightweight app-level measurements, not native trace equivalents.
- Final production performance still needs measurement on physical low-memory Android hardware.
- Realtime and payment surfaces still need live backend validation where demo data remains in use.
