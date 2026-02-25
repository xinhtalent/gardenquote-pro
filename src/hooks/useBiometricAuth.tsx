import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "./use-mobile";

export function useBiometricAuth() {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [hasBiometricSetup, setHasBiometricSetup] = useState(false);
  const [lastLoginEmail, setLastLoginEmail] = useState<string | null>(null);
  const [lastLoginName, setLastLoginName] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    checkBiometricAvailability();
    checkBiometricSetup();
  }, [isMobile]);

  const checkBiometricAvailability = () => {
    // Only enable biometric on mobile devices
    if (!isMobile) {
      setIsBiometricAvailable(false);
      return;
    }

    // Check if WebAuthn is supported
    const available = 
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined;
    
    setIsBiometricAvailable(available);
  };

  // Utilities to correctly handle WebAuthn base64url encoding
  const base64UrlToUint8Array = (base64url: string): Uint8Array => {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(base64 + padding);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  };

  const checkBiometricSetup = () => {
    const hasPasskey = localStorage.getItem("has_passkey");
    const email = localStorage.getItem("last_login_email");
    const name = localStorage.getItem("last_login_name");
    
    setHasBiometricSetup(!!hasPasskey);
    setLastLoginEmail(email);
    setLastLoginName(name);
  };

  const setupBiometric = async (email: string, displayName?: string): Promise<boolean> => {
    try {
      if (!isBiometricAvailable) {
        toast.error("Thiết bị của bạn không hỗ trợ sinh trắc học");
        return false;
      }

      // Step 1: Get registration options from server
      const { data: options, error: optionsError } = await supabase.functions.invoke(
        'webauthn-register?step=options',
        {
          body: { email, displayName },
          method: 'POST',
        }
      );

      if (optionsError) throw optionsError;
      if (!options) throw new Error("Không nhận được options từ server");

      // Step 2: Create credential using WebAuthn
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: base64UrlToUint8Array(options.challenge),
          user: {
            ...options.user,
            id: base64UrlToUint8Array(options.user.id),
          },
          excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
            ...cred,
            id: base64UrlToUint8Array(cred.id),
          })),
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Không thể tạo credential");
      }

      // Step 3: Send credential to server for verification
      const attestationResponse = credential.response as AuthenticatorAttestationResponse;
      const { error: verifyError } = await supabase.functions.invoke(
        'webauthn-register?step=verify',
        {
          body: {
            email,
            attestationResponse: {
              id: credential.id,
              rawId: arrayBufferToBase64Url(credential.rawId),
              type: credential.type,
              response: {
                clientDataJSON: arrayBufferToBase64Url(attestationResponse.clientDataJSON),
                attestationObject: arrayBufferToBase64Url(attestationResponse.attestationObject),
                transports: (attestationResponse as any).getTransports?.() || [],
              }
            }
          },
          method: 'POST',
        }
      );

      if (verifyError) throw verifyError;

      // Store in localStorage for quick access
      localStorage.setItem("has_passkey", "1");
      localStorage.setItem("last_login_email", email);
      localStorage.setItem("last_login_name", displayName || email);

      setHasBiometricSetup(true);
      setLastLoginEmail(email);
      setLastLoginName(displayName || email);
      
      toast.success("Đăng nhập sinh trắc học đã được kích hoạt!");
      return true;
    } catch (error: any) {
      console.error("Error setting up biometric:", error);
      if (error.name === "NotAllowedError") {
        toast.error("Bạn đã từ chối quyền truy cập sinh trắc học");
      } else {
        toast.error("Không thể thiết lập đăng nhập sinh trắc học");
      }
      return false;
    }
  };

  const loginWithBiometric = async (): Promise<boolean> => {
    try {
      if (!hasBiometricSetup) {
        toast.error("Vui lòng thiết lập sinh trắc học trước");
        return false;
      }

      const email = lastLoginEmail;
      if (!email) {
        toast.error("Không tìm thấy thông tin đăng nhập");
        return false;
      }

      // Step 1: Get authentication options from server
      const { data: options, error: optionsError } = await supabase.functions.invoke(
        'webauthn-login?step=options',
        {
          body: { email },
          method: 'POST',
        }
      );

      if (optionsError) throw optionsError;
      if (!options) throw new Error("Không nhận được options từ server");

      // Step 2: Get credential using WebAuthn
      const assertion = await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: base64UrlToUint8Array(options.challenge),
          allowCredentials: options.allowCredentials?.map((cred: any) => ({
            ...cred,
            id: base64UrlToUint8Array(cred.id),
          })),
        }
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error("Xác thực thất bại");
      }

      // Step 3: Send assertion to server for verification and get OTP
      const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'webauthn-login?step=verify',
        {
          body: {
            email,
            assertionResponse: {
              id: assertion.id,
              rawId: arrayBufferToBase64Url(assertion.rawId),
              type: assertion.type,
              response: {
                clientDataJSON: arrayBufferToBase64Url(assertionResponse.clientDataJSON),
                authenticatorData: arrayBufferToBase64Url(assertionResponse.authenticatorData),
                signature: arrayBufferToBase64Url(assertionResponse.signature),
                userHandle: assertionResponse.userHandle ? arrayBufferToBase64Url(assertionResponse.userHandle) : null,
              }
            }
          },
          method: 'POST',
        }
      );

      if (verifyError) throw verifyError;
      if (!verifyData?.email_otp) throw new Error("Không nhận được token xác thực");

      // Step 4: Verify OTP to get session
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: verifyData.email,
        token: verifyData.email_otp,
        type: 'magiclink',
      });

      if (otpError) throw otpError;

      toast.success("Đăng nhập thành công!");
      return true;
    } catch (error: any) {
      console.error("Error logging in with biometric:", error);
      if (error.name === "NotAllowedError") {
        toast.error("Xác thực sinh trắc học thất bại");
      } else if (error.message?.includes("No credentials found") || error.message?.includes("Credential not found")) {
        toast.error("Chưa có thông tin sinh trắc học. Vui lòng đăng nhập bằng mật khẩu và thiết lập lại");
        removeBiometric();
      } else if (error.message?.includes("Challenge not found")) {
        toast.error("Phiên xác thực đã hết hạn. Vui lòng thử lại");
      } else {
        toast.error("Không thể đăng nhập bằng sinh trắc học");
      }
      return false;
    }
  };

  const removeBiometric = () => {
    localStorage.removeItem("has_passkey");
    localStorage.removeItem("last_login_email");
    localStorage.removeItem("last_login_name");
    setHasBiometricSetup(false);
    setLastLoginEmail(null);
    setLastLoginName(null);
    toast.success("Đã xóa đăng nhập sinh trắc học");
  };

  return {
    isBiometricAvailable,
    hasBiometricSetup,
    lastLoginEmail,
    lastLoginName,
    setupBiometric,
    loginWithBiometric,
    removeBiometric,
  };
}
