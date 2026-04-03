// features/auth/BiometricAuthService.ts
// Phase 7 — Mobile PWA — Biometric Authentication Service
// WebAuthn API integration for fingerprint and face recognition login

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

export interface BiometricCredential {
  id: string;
  rawId: string;
  type: "public-key";
  authenticatorAttachment: "platform" | "cross-platform";
  publicKey: string;
  counter: number;
  createdAt: string;
  lastUsedAt?: string;
}

export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: "public-key";
    alg: number;
  }>;
  timeout: number;
  attestation: "none" | "direct" | "indirect";
  authenticatorSelection: {
    authenticatorAttachment: "platform" | "cross-platform";
    requireResidentKey: boolean;
    userVerification: "required" | "preferred" | "discouraged";
  };
}

export interface AuthenticationOptions {
  challenge: string;
  allowCredentials: Array<{
    type: "public-key";
    id: string;
    transports: ("usb" | "nfc" | "ble" | "internal")[];
  }>;
  timeout: number;
  userVerification: "required" | "preferred" | "discouraged";
  rpId: string;
}

class BiometricAuthService {
  /** Check if WebAuthn is supported */
  isSupported(): boolean {
    return window.PublicKeyCredential !== undefined &&
      typeof navigator.credentials !== "undefined";
  }

  /** Check if platform authenticator (biometric) is available */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      // @ts-ignore - PublicKeyCredential may not be in types
      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return isAvailable;
    } catch {
      return false;
    }
  }

  /** Register a new biometric credential */
  async registerCredential(
    userId: string,
    userEmail: string,
    userName: string,
    userToken: string
  ): Promise<BiometricCredential | null> {
    try {
      // Step 1: Get registration options from server
      const optionsResponse = await fetch(`${API}/auth/biometric/register/options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          userId,
          email: userEmail,
          name: userName,
        }),
      });

      if (!optionsResponse.ok) {
        throw new Error("Failed to get registration options");
      }

      const options: RegistrationOptions = await optionsResponse.json();

      // Step 2: Create credential with browser
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: this.base64UrlToBuffer(options.challenge),
          rp: options.rp,
          user: {
            ...options.user,
            id: this.base64UrlToBuffer(options.user.id),
          },
          pubKeyCredParams: options.pubKeyCredParams,
          timeout: options.timeout,
          attestation: options.attestation,
          authenticatorSelection: options.authenticatorSelection,
        },
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Credential creation failed");
      }

      // Step 3: Send credential to server for verification
      const response = await fetch(`${API}/auth/biometric/register/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          id: credential.id,
          rawId: this.bufferToBase64Url(new Uint8Array(credential.rawId)),
          type: credential.type,
          authenticatorAttachment: credential.authenticatorAttachment,
          response: {
            clientDataJSON: this.bufferToBase64Url(
              new Uint8Array((credential.response as AuthenticatorAttestationResponse).clientDataJSON)
            ),
            attestationObject: this.bufferToBase64Url(
              new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)
            ),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Credential verification failed");
      }

      const result = await response.json();
      return result.credential;
    } catch (error) {
      console.error("[Biometric] Registration error:", error);
      return null;
    }
  }

  /** Authenticate with biometric credential */
  async authenticate(userToken: string): Promise<{ success: boolean; token?: string }> {
    try {
      // Step 1: Get authentication options from server
      const optionsResponse = await fetch(`${API}/auth/biometric/authenticate/options`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (!optionsResponse.ok) {
        throw new Error("Failed to get authentication options");
      }

      const options: AuthenticationOptions = await optionsResponse.json();

      // Step 2: Get assertion from browser
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: this.base64UrlToBuffer(options.challenge),
          allowCredentials: options.allowCredentials.map((cred) => ({
            ...cred,
            id: this.base64UrlToBuffer(cred.id),
          })),
          timeout: options.timeout,
          userVerification: options.userVerification,
          rpId: options.rpId,
        },
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error("Authentication failed");
      }

      // Step 3: Send assertion to server for verification
      const response = await fetch(`${API}/auth/biometric/authenticate/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          id: assertion.id,
          rawId: this.bufferToBase64Url(new Uint8Array(assertion.rawId)),
          type: assertion.type,
          authenticatorAttachment: assertion.authenticatorAttachment,
          response: {
            clientDataJSON: this.bufferToBase64Url(
              new Uint8Array((assertion.response as AuthenticatorAssertionResponse).clientDataJSON)
            ),
            authenticatorData: this.bufferToBase64Url(
              new Uint8Array((assertion.response as AuthenticatorAssertionResponse).authenticatorData)
            ),
            signature: this.bufferToBase64Url(
              new Uint8Array((assertion.response as AuthenticatorAssertionResponse).signature)
            ),
            userHandle: (assertion.response as AuthenticatorAssertionResponse).userHandle
              ? this.bufferToBase64Url(
                  new Uint8Array((assertion.response as AuthenticatorAssertionResponse).userHandle!)
                )
              : null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Authentication verification failed");
      }

      const result = await response.json();
      return { success: true, token: result.token };
    } catch (error) {
      console.error("[Biometric] Authentication error:", error);
      return { success: false };
    }
  }

  /** List registered credentials */
  async listCredentials(userToken: string): Promise<BiometricCredential[]> {
    try {
      const response = await fetch(`${API}/auth/biometric/credentials`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.credentials;
      }
    } catch (error) {
      console.error("[Biometric] Failed to list credentials:", error);
    }

    return [];
  }

  /** Delete a credential */
  async deleteCredential(credentialId: string, userToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${API}/auth/biometric/credentials/${credentialId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("[Biometric] Failed to delete credential:", error);
      return false;
    }
  }

  // ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────

  private bufferToBase64Url(buffer: Uint8Array): string {
    const bytes = btoa(String.fromCharCode(...buffer));
    return bytes.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  private base64UrlToBuffer(base64Url: string): ArrayBuffer {
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = atob(base64);
    const buffer = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      buffer[i] = bytes.charCodeAt(i);
    }
    return buffer.buffer.slice(0);
  }
}

export const biometricAuthService = new BiometricAuthService();
export default biometricAuthService;
