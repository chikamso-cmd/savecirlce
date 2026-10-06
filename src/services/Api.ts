// Mock API so the flow runs end-to-end. Swap each function for a real call to your Node API.
import type { KybData, KybStatus, OrgType, Provider } from "../types/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// v4 §4.1 step 1: admin signs up with phone + OTP
export async function sendSignupOtp(
  _phone: string,
): Promise<{ resendInSeconds: number }> {
  // Real version: POST /auth/otp; send the code by SMS/WhatsApp through the Notifier
  await wait(900);
  return { resendInSeconds: 60 };
}

export async function verifySignupOtp(
  phone: string,
  code: string,
  fullName: string,
): Promise<{ userId: string; phone: string; fullName: string }> {
  // Real version: POST /auth/otp/verify; returns a session for the new user
  await wait(900);
  if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code.");
  if (code === "000000")
    throw new Error("That code is wrong or has expired. Try again or resend.");
  return { userId: crypto.randomUUID(), phone, fullName };
}

export interface AuthUser {
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
}

export async function signInWithGoogle(
  _code: string,
  mode: "login" | "signup",
): Promise<{ user: AuthUser; isNewUser: boolean }> {
  // Real version: POST /auth/google { code }. The server exchanges the code with Google
  // (client secret stays server-side), verifies the ID token, then finds or creates the user.
  await wait(900);
  return {
    user: {
      userId: crypto.randomUUID(),
      fullName: "Google User",
      email: "user@example.com",
    },
    isNewUser: mode === "signup",
  };
}

export async function createOrganisation(_details: {
  name: string;
  type: OrgType;
}): Promise<{ organisationId: string }> {
  // Real version: POST /organisations; the signed-in user becomes its Owner (v4 §3.1)
  await wait(800);
  return { organisationId: crypto.randomUUID() };
}

export async function resolveAccountName(
  bankCode: string,
  accountNumber: string,
): Promise<string> {
  await wait(900);
  if (!bankCode || accountNumber.length !== 10)
    throw new Error("Enter a 10-digit account number and pick a bank.");
  if (accountNumber.endsWith("0000"))
    throw new Error(
      "No account found. Check the number and bank, then try again.",
    );
  return "SAMPLE ORGANISATION LTD";
}

export async function submitKyb(
  _data: KybData,
): Promise<{ reference: string; submittedAt: string }> {
  // Real version: multipart upload of documents + directors + settlement account
  await wait(1200);
  return {
    reference: `KYB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    submittedAt: new Date().toISOString(),
  };
}

export async function fetchKybStatus(_reference: string): Promise<KybStatus> {
  await wait(800);
  return "in_review";
}

export interface GatewayCheck {
  keysValid: boolean;
  webhookRegistered: boolean;
  transfersEnabled: boolean; // v4 §6.4: required before automatic withdrawals
}

export async function connectGateway(
  provider: Provider,
  secretKey: string,
): Promise<GatewayCheck> {
  await wait(1200);
  const looksValid =
    provider === "paystack"
      ? /^sk_(live|test)_/.test(secretKey)
      : /^FLWSECK(_TEST)?-/.test(secretKey);
  if (!looksValid) {
    const name = provider === "paystack" ? "Paystack" : "Flutterwave";
    throw new Error(
      `That doesn't look like a ${name} secret key. Copy it from your ${name} dashboard settings.`,
    );
  }
  return { keysValid: true, webhookRegistered: true, transfersEnabled: true };
}

export async function requestBankIntegration(_details: {
  contactName: string;
  email: string;
  coreBanking: string;
}) {
  await wait(1000);
  return {
    ticket: `INT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
  };
}
