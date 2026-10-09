// Mock auth API for the password reset flow. TODO: replace with real endpoints.

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const OTP_LENGTH = 6;
export const RESEND_SECONDS = 60;
export const MAX_OTP_ATTEMPTS = 5;

// TODO: POST /auth/password/forgot  { identifier }
// Always resolves the same way so the screen never reveals whether an account exists.
export async function requestReset(
  identifier: string,
): Promise<{ channel: "sms" | "email"; masked: string }> {
  await wait(900);
  const isEmail = identifier.includes("@");
  const masked = isEmail
    ? identifier.replace(/^(.).*(@.*)$/, "$1•••$2")
    : identifier.replace(/\s/g, "").replace(/^(.{4}).*(.{2})$/, "$1 ••• ••$2");
  return { channel: isEmail ? "email" : "sms", masked };
}

// TODO: POST /auth/password/verify-otp  { identifier, code } → short-lived reset token
export async function verifyOtp(
  _identifier: string,
  code: string,
): Promise<{ resetToken: string }> {
  await wait(800);
  if (code === "000000")
    throw new Error("That code has expired. Request a new one.");
  if (code !== "123456")
    throw new Error("That code isn't right. Check the message and try again.");
  return { resetToken: `rst_${Math.random().toString(36).slice(2)}` };
}

// TODO: POST /auth/password/reset  { resetToken, password }
export async function resetPassword(resetToken: string, _password: string) {
  await wait(900);
  if (!resetToken)
    throw new Error("Your reset session has expired. Start again.");
}
