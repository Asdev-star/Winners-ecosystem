import * as Linking from "expo-linking";

const linking = {
  prefixes: [Linking.createURL("/"), "winners://"],
  config: {
    screens: {
      Login: "login",
      Onboarding: "onboarding",
      AppTabs: {
        screens: {
          CommunityStack: {
            screens: {
              Feed: "community",
              Post: "community/post/:postId",
            },
          },
          AcademyStack: {
            screens: {
              Courses: "academy",
              Lesson: "academy/lesson/:lessonId",
            },
          },
          MarketStack: {
            screens: {
              MarketHome: "market",
              Checkout: "market/checkout",
            },
          },
          Work: "work",
          Intelligence: "intelligence/aria",
        },
      },
    },
  },
};

export default linking;
