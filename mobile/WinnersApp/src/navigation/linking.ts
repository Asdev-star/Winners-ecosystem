import * as Linking from "expo-linking";
import { LinkingOptions } from "@react-navigation/native";
import { RootStackParamList } from "./types";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL("/"),
    "winnersecosystem://",
    "https://app.winnersecosystem.com",
  ],
  config: {
    screens: {
      Login: "login",
      Onboarding: "onboarding",
      Main: {
        screens: {
          Community: "community",
          Academy: "academy",
          Market: "market",
          Work: "work",
          Aria: "intelligence",
        },
      },
      Post: "community/post/:postId",
      Lesson: "academy/lesson/:lessonId",
      Checkout: "market/checkout/:planId?",
    },
  },
};
