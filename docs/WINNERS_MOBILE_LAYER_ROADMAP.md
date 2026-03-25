# Winners Mobile Layer Roadmap

## North Star

The ecosystem runs on every device the user carries.
HERALD ensures it.
Every notification is an invitation.
Every offline lesson is a commitment kept.
Every voice input is infrastructure that serves the user, not the cloud.

## Sprint Order

### Week 1

- Day 1-2: Expand service worker for offline caching and background sync
- Day 2-3: Ship smart install prompt and offline indicator components
- Day 3-5: Wire Firebase FCM across backend and frontend, then validate with test push

### Week 2

- React Native Expo setup
- Biometric login
- Bottom tab navigation

### Week 3

- Offline Academy video player
- Voice input component for Aria

### Week 4

- HERALD mobile monitoring
- Deep links
- App Store and Play Store submission prep

### Month 2+

- App Store submission for iOS and Android

## Delivery Status

### Implemented in repo

- Expanded PWA service worker with offline caching, background sync, and push notification handling
- Smart install prompt, offline indicator, push permission flow, and offline queue support
- Firebase device token registration and FCM delivery wiring
- Expo mobile app scaffold under `mobile/WinnersApp`
- Biometric-aware login, mobile navigation, offline lesson playback, and voice input
- HERALD mobile monitoring service and FORGE mobile health reporting
- Deep-link configuration for `winners://` and Railway URLs

### Still to finish

- Real Firebase web app public config values in `.env`
- End-to-end push validation on devices
- Client telemetry for offline session rate and true push-open tracking
- Native payment completion for Stripe and later Flutterwave / M-Pesa
- Store assets, signing, bundle identifiers, release builds, and store submission metadata
- Replace demo auth state with real backend login, register, session expiry, and token refresh
- Connect Community, Market, Academy, and Work screens to live backend data instead of static or placeholder content
- Wire Aria to a real backend LLM endpoint instead of returning local placeholder responses
- Reinstall and revalidate the canonical Expo app dependencies in `mobile/WinnersApp`
- Refine offline sync for complex payloads such as media uploads and multi-step transactions
- Move mobile API base values and release secrets into a stronger environment strategy for staging and production builds

## Monetisation Model

| Stream | Model | Platform | Timing | Status |
| --- | --- | --- | --- | --- |
| Premium subscription benefit | Mobile-exclusive premium value | PWA | Live now | Active |
| In-app purchases (Stripe) | Courses and AI credits | React Native | After native checkout completion | Building |
| M-Pesa via Flutterwave | Primary payment rail for African market | React Native | After native payments baseline | Planned |
| Vendor-paid promotional pushes | Sponsored notification campaigns | React Native | After 10K users | Gated |
| App Store presence | Organic discovery | React Native | After submission prep | Planned |

## HERALD Success Metrics

| Metric | Month 1 Target | Month 3 Target | Notes |
| --- | --- | --- | --- |
| PWA install rate | 15% of mobile users | 30% | Track installed web footprint |
| Push opt-in rate | 40% | 60% | Track active push-enabled users |
| Push open rate | 25% | 35% | Current backend uses a read-rate proxy until explicit open telemetry lands |
| Offline session rate | 5% | 10% | Requires client telemetry |
| Mobile DAU / Web DAU | 40% | 65% | Uses activity logs plus registered mobile user cohort |
| App Store rating (iOS) | N/A | 4.5+ | Requires store telemetry after launch |
| FCM delivery rate | 95%+ | 98%+ | Uses active token ratio as the current delivery health proxy |

## Release Checklist

- Confirm Firebase web app config values and VAPID key in environment files
- Replace demo auth plumbing with production-ready backend auth flows
- Validate service worker, offline queue replay, and offline academy playback on real devices
- Send and receive test push notifications on web and mobile
- Connect mobile screens to real backend data for feed, marketplace, academy progress, work board, and Aria
- Finish native monetization flow and validate payment success / failure states
- Complete full payment orchestration for PaymentIntents, order confirmation, and future Flutterwave / M-Pesa paths
- Add app icons, splash assets, screenshots, privacy policy, and support URLs
- Move mobile environment values out of hardcoded runtime helpers and into release-aware config
- Prepare iOS and Android signing credentials
- Build release binaries and run submission smoke tests
- Submit to App Store Connect and Google Play Console
