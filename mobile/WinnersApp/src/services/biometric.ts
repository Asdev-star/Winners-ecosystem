import * as LocalAuthentication from "expo-local-authentication";

export interface BiometricResult {
  success: boolean;
  reason?: string;
}

export async function authenticateWithBiometrics(
  promptMessage = "Unlock Winners App",
): Promise<BiometricResult> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !enrolled) {
    return {
      success: false,
      reason: "Biometrics unavailable on this device.",
    };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: "Use device passcode",
  });

  return {
    success: result.success,
    reason: result.success ? undefined : "Authentication was cancelled or failed.",
  };
}
