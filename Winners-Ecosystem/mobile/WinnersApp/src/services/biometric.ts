import * as LocalAuthentication from "expo-local-authentication";

export type BiometricStatus = {
  available: boolean;
  enrolled: boolean;
  label: string;
};

export const biometric = {
  async getStatus(): Promise<BiometricStatus> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
    const supportedTypes = hasHardware ? await LocalAuthentication.supportedAuthenticationTypesAsync() : [];

    const label =
      supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
        ? "Face ID"
        : supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
          ? "Fingerprint"
          : "Biometric";

    return {
      available: hasHardware,
      enrolled: isEnrolled,
      label,
    };
  },

  async authenticate(reason = "Sign in to Winners Ecosystem") {
    const status = await this.getStatus();
    if (!status.available || !status.enrolled) {
      return { success: false, reason: "Biometrics unavailable on this device." };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use device passcode",
      disableDeviceFallback: false,
    });

    return {
      success: result.success,
      reason: result.success ? null : result.warning || "Authentication was cancelled.",
    };
  },
};
