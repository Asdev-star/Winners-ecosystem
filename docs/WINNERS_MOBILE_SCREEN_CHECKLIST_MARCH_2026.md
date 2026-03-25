# Winners Mobile Screen Checklist

Updated: March 23, 2026
Scope: `mobile/WinnersApp`

## Deep Links

- `winners://community` -> Community feed
- `winners://community/posts/:postId` -> Post detail
- `winners://academy` -> Academy home
- `winners://academy/courses/:slug` -> Course detail
- `winners://market` -> Market home
- `winners://market/products/:productId` -> Product detail
- `winners://work` -> Work home
- `winners://work/jobs/:jobId` -> Job detail
- `winners://intelligence` -> AI hub
- `winners://intelligence/aria` -> ARIA chat
- `winners://profile/:userId` -> Profile modal
- `winners://academy/certificates/:certId` -> Certificate

Source of truth: `mobile/WinnersApp/src/navigation/linking.ts`

## Build Order

### Week 1 - Authentication + Shell

- [x] `LoginScreen.tsx`
- [x] `RegisterScreen.tsx`
- [x] `ForgotPasswordScreen.tsx`
- [x] `OnboardingScreen.tsx`
- [x] `BottomTabNavigator`
- [x] `HeaderComponent`

### Week 2 - Community

- [x] `CommunityFeedScreen.tsx`
- [x] `PostDetailScreen.tsx`
- [x] `CreatePostScreen.tsx`
- [x] `GroupsScreen.tsx`
- [x] `GroupDetailScreen.tsx`

### Week 3 - Academy

- [x] `AcademyHomeScreen.tsx`
- [x] `CourseDetailScreen.tsx`
- [x] `CoursePlayerScreen.tsx`
- [x] `MyLearningScreen.tsx`

### Week 4 - Market

- [x] `MarketHomeScreen.tsx`
- [x] `ProductDetailScreen.tsx`
- [x] `CartScreen.tsx`
- [x] `CheckoutScreen.tsx`
- [~] `OrderDetailScreen.tsx`

### Week 5 - Work + AI

- [x] `WorkHomeScreen.tsx`
- [x] `JobDetailScreen.tsx`
- [x] `ApplyScreen.tsx`
- [x] `ContractDetailScreen.tsx`
- [x] `FreelancerProfileScreen.tsx`
- [x] `AIHubScreen.tsx`
- [x] `ARIAChatScreen.tsx`

### Week 6 - Profile + Settings + Polish

- [x] `ProfileScreen.tsx`
- [x] `SettingsScreen.tsx`
- [x] `NotificationsScreen.tsx`
- [x] `MessagesScreen.tsx`
- [x] Accessibility audit
- [x] Offline testing
- [~] Performance profiling

## Status Key

- `[x]` implemented mobile screen or shell
- `[~]` partial implementation or verification completed, with remaining follow-up
- `[ ]` not yet started
