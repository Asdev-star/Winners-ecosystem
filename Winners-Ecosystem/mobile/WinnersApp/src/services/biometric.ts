import * as LocalAuthentication from 'expo-local-authentication';

export const biometric = {
  authenticate: async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login to Winners Ecosystem',
      fallbackLabel: 'Use Passcode',
    });

    return result.success;
  },
};