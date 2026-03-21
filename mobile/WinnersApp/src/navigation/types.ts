export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  Main: undefined;
  Post: { postId: string };
  Lesson: { lessonId: string };
  Checkout: { planId?: string; source?: string };
};

export type TabParamList = {
  Community: undefined;
  Academy: undefined;
  Market: undefined;
  Work: undefined;
  Aria: undefined;
};
