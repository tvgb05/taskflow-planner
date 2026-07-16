"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiRequest,
  authUser,
  initializeCsrf,
  unwrapResource,
  type AuthResponse,
} from "@/lib/api";
import type { User } from "@/lib/types";

type LoginInput = {
  email: string;
  password: string;
  remember: boolean;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  otp: string;
};

type ProfileInput = {
  name: string;
  email: string;
};

type ProfileResponse = {
  message: string;
  user: User;
  verification_email_sent: boolean | null;
};

type VerificationResponse = {
  message: string;
  verification_email_sent: boolean;
};

type VerifyOtpResponse = {
  message: string;
  user: User | { data: User };
};

type AuthContextValue = {
  booting: boolean;
  authenticated: boolean;
  user: User | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  sendRegistrationOtp: (input: { email: string; recaptcha_token: string | null }) => Promise<string>;
  updateProfile: (input: ProfileInput) => Promise<ProfileResponse>;
  resendVerificationEmail: () => Promise<VerificationResponse>;
  verifyEmailOtp: (otp: string) => Promise<string>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    apiRequest<{ data: User }>("/me")
      .then((payload) => setUser(unwrapResource(payload)))
      .catch(() => {
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    await initializeCsrf();
    const payload = await apiRequest<AuthResponse>("/login", {
      method: "POST",
      body: input,
    });

    setUser(authUser(payload));
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    await initializeCsrf();
    const payload = await apiRequest<AuthResponse>("/register", {
      method: "POST",
      body: input,
    });

    setUser(authUser(payload));
  }, []);

  const sendRegistrationOtp = useCallback(async (input: { email: string; recaptcha_token: string | null }) => {
    await initializeCsrf();
    const payload = await apiRequest<{ message: string }>("/register/otp", {
      method: "POST",
      body: input,
    });

    return payload.message;
  }, []);

  const updateProfile = useCallback(async (input: ProfileInput) => {
    const payload = await apiRequest<
      Omit<ProfileResponse, "user"> & { user: User | { data: User } }
    >("/me", {
      method: "PUT",
      body: input,
    });
    const nextUser = unwrapResource(payload.user);

    setUser(nextUser);

    return {
      message: payload.message,
      user: nextUser,
      verification_email_sent: payload.verification_email_sent,
    };
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    return apiRequest<VerificationResponse>("/email/verification-notification", {
      method: "POST",
    });
  }, []);

  const verifyEmailOtp = useCallback(async (otp: string) => {
    const payload = await apiRequest<VerifyOtpResponse>("/email/verify-otp", {
      method: "POST",
      body: { otp },
    });

    setUser(unwrapResource(payload.user));

    return payload.message;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      booting,
      authenticated: user !== null,
      user,
      login,
      register,
      sendRegistrationOtp,
      updateProfile,
      resendVerificationEmail,
      verifyEmailOtp,
      logout,
    }),
    [
      booting,
      user,
      login,
      register,
      sendRegistrationOtp,
      updateProfile,
      resendVerificationEmail,
      verifyEmailOtp,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
