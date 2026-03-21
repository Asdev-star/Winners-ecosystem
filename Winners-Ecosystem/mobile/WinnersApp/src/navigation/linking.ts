import * as Linking from 'expo-linking';

export const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Onboarding: 'onboarding',
        },
      },
      Main: {
        screens: {
          Community: 'community',
          Academy: 'academy',
          Market: 'market',
          Work: 'work',
          Intelligence: 'intelligence',
        },
      },
    },
  },
};