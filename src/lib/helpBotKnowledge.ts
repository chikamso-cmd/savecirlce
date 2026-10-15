// Knowledge and matching for the in-app help bot.
// The bot answers simple "how do I" questions from this list. Anything sensitive
// (money gone missing, disputes, fraud, bugs) or anything it can't match is handed
// to a customer representative instead of guessed at.

export interface HelpTopic {
  id: string;
  title: string;
  keywords: string[]; // words match as prefixes ("withdraw" matches "withdrawals"); phrases match anywhere
  answer: string;
  link?: { to: string; label: string };
}

// TODO: replace with your real support contacts
export const SUPPORT = {
  email: "support@example.com",
  hours: "Monday to Friday, 8am to 6pm WAT",
  replyTime: "within one working day",
};

// Topic ids offered as quick questions when the chat opens
export const STARTER_TOPICS = ["create-group", "unmatched", "withdrawals", "branding"];

export const TOPICS: HelpTopic[] = [
  {
    id: "create-group",
    title: "Create a savings group",
    keywords: ["create group", "new group", "start group", "add group", "set up group", "ajo", "esusu", "thrift", "group"],
    answer:
      "Go to Groups and choose New group. Pick the group type, contribution amount and schedule, then add members by hand or upload a two-column list (name, phone). Each member gets an invite to verify and receives their own account number.",
    link: { to: "/groups/new", label: "Create a group" },
  },
  {
    id: "members",
    title: "Add or manage members",
    keywords: ["member", "add member", "invite", "upload list", "phone number", "member account"],
    answer:
      "Members lists everyone saving with your organisation across all groups. Use Add members to invite people. Each member gets one account number for all their groups. Members without an account number can still pay cash to an officer.",
    link: { to: "/members", label: "Open Members" },
  },
  {
    id: "unmatched",
    title: "Unmatched payments",
    keywords: ["unmatched", "unknown payment", "assign payment", "wrong account", "can't match", "cant match", "unidentified", "refund"],
    answer:
      "Unmatched payments are transfers into the organisation account (or a blocked member account) that we couldn't tie to a member. Open each one and either assign it to a member or mark it for refund. Assigned or refunded payments then show up in Payments.",
    link: { to: "/unmatched", label: "Review unmatched" },
  },
  {
    id: "withdrawals",
    title: "Withdrawals and approvals",
    keywords: ["withdraw", "payout", "approve", "approval", "maker", "checker", "notice period", "instant limit", "cash out"],
    answer:
      "Withdrawals follow your organisation policy. Amounts under the instant limit go straight through. Larger ones need a notice period, and amounts above the two-person limit need a maker and a different checker to approve. Once approved, the transfer goes out automatically on its due date.",
    link: { to: "/withdrawals", label: "Open Withdrawals" },
  },
  {
    id: "withdrawal-policy",
    title: "Change withdrawal rules",
    keywords: ["policy", "lock-in", "lock in", "minimum balance", "early withdrawal", "fee", "withdrawal rule", "reminder"],
    answer:
      "Go to Settings, then Policies. You can set the notice period, instant limit, lock-in, minimum balance, monthly withdrawal count, two-person approval limit, early-withdrawal fee and payment reminders. Each group can override these.",
    link: { to: "/settings", label: "Open Settings" },
  },
  {
    id: "cash",
    title: "Cash in hand",
    keywords: ["cash", "cash in hand", "officer cash", "deposit cash", "bank cash", "log cash"],
    answer:
      "Cash in hand lists cash officers have logged but not yet banked. When an officer deposits it into the collection account, record the deposit so the ledger and the bank statement agree.",
    link: { to: "/cash", label: "Open Cash in hand" },
  },
  {
    id: "reconciliation",
    title: "Reconciliation",
    keywords: ["reconcil", "settlement", "mismatch", "ledger", "webhook", "doesn't match", "balance off"],
    answer:
      "Each night we compare your provider's settlement report with the SaveCircle ledger. Reconciliation lists anything that differs, such as a settled payment with no webhook or an amount mismatch, with a suggested fix for each.",
    link: { to: "/reconciliation", label: "Open Reconciliation" },
  },
  {
    id: "reports",
    title: "Reports and exports",
    keywords: ["report", "export", "download", "statement", "csv", "excel", "pdf", "agm", "audit"],
    answer:
      "Reports covers collections, group performance, withdrawals, officer cash and the audit log. You can also export a single member's statement. Use the Export button on any report to download it.",
    link: { to: "/reports", label: "Open Reports" },
  },
  {
    id: "team",
    title: "Team and roles",
    keywords: ["team", "staff", "role", "officer", "admin", "permission", "finance approver", "branch manager", "invite staff"],
    answer:
      "Team & roles is where you invite staff and choose what each person can do: Owner, Admin, Finance approver, Branch manager or Officer. Nobody can approve their own request, so keep at least one active finance approver.",
    link: { to: "/team", label: "Open Team & roles" },
  },
  {
    id: "branding",
    title: "Change the app colour or logo",
    keywords: ["colour", "color", "brand", "theme colour", "logo", "branding", "customise", "customize", "sender id"],
    answer:
      "Go to Settings, then Branding. Pick a brand colour (or choose your own with the custom picker) to re-colour the whole app, and upload your logo. Press Save changes to keep it.",
    link: { to: "/settings?tab=branding", label: "Open Branding" },
  },
  {
    id: "dark-mode",
    title: "Dark mode",
    keywords: ["dark mode", "dark", "light mode", "night mode", "appearance"],
    answer:
      "Use the moon icon in the top bar to switch between light and dark, or open your account menu and choose Light, Dark or System under Appearance.",
  },
  {
    id: "branches",
    title: "Branches",
    keywords: ["branch", "branches", "office"],
    answer:
      "Use the Branch menu in the top bar to filter by branch. Single-office organisations can turn branches off in Settings, then Organisation.",
    link: { to: "/settings", label: "Open Settings" },
  },
  {
    id: "rails",
    title: "Payment provider and keys",
    keywords: ["paystack", "gateway", "secret key", "api key", "payment rail", "provider", "collection account", "test connection"],
    answer:
      "Go to Settings, then Payment rails, to see your provider and collection account and run Test connection. Only the owner can replace the secret key. Funds stay in your own gateway account, never with SaveCircle.",
    link: { to: "/settings?tab=rails", label: "Open Payment rails" },
  },
  {
    id: "password",
    title: "Reset a password",
    keywords: ["password", "forgot", "reset", "sign in", "login", "log in", "otp", "verification code"],
    answer:
      "On the sign-in screen choose Forgot password. We'll send a one-time code to your email; enter it and set a new password. If the code doesn't arrive after a few minutes, check spam, then ask for a new code.",
  },
  // Generic, so it sits last: specific topics win ties ("unmatched payment" goes to Unmatched)
  {
    id: "payments",
    title: "See payments",
    keywords: ["payment", "contribution", "paid", "receipt", "transaction", "transfer in", "collection"],
    answer:
      "Payments shows every contribution received by transfer, card or cash. Open a payment to see who paid, which group and cycle it went to, and the receipt that was sent.",
    link: { to: "/payments", label: "Open Payments" },
  },
];

// Phrases that mean "let me talk to a person"
const HUMAN_REQUEST = [
  "human", "agent", "representative", "real person", "customer care", "customer service",
  "support team", "talk to someone", "speak to someone", "speak to a", "talk to a", "call me", "contact support",
];

// Problems the bot should never try to solve on its own
const NEEDS_PERSON = [
  "fraud", "scam", "stolen", "hacked", "unauthorised", "unauthorized", "dispute", "chargeback",
  "charged twice", "debited twice", "double debit", "missing money", "money missing", "not received",
  "didn't receive", "didnt receive", "never received", "lost money", "refund not", "legal", "complaint",
  "bug", "crash", "error", "not working", "isn't working", "doesn't work", "broken", "locked out",
  "delete my account", "close my account", "verification failed", "kyb rejected",
];

const GREETING = /^(hi|hello|hey|good (morning|afternoon|evening)|howdy)\b/;
const THANKS = /\b(thanks|thank you|thx|cheers)\b/;

export type BotReply =
  | { kind: "answer"; topic: HelpTopic; related: HelpTopic[] }
  | { kind: "escalate"; reason: "asked" | "complex" }
  | { kind: "greeting" }
  | { kind: "thanks" }
  | { kind: "unknown"; suggestions: HelpTopic[] };

const normalise = (s: string) =>
  s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' -]+/g, " ").replace(/\s+/g, " ").trim();

function scoreTopic(text: string, words: string[], topic: HelpTopic): number {
  let score = 0;
  for (const kw of topic.keywords) {
    if (kw.includes(" ")) {
      if (text.includes(kw)) score += 3;
    } else if (words.some((w) => w.startsWith(kw) || (w.length > 3 && kw.startsWith(w)))) {
      score += 2;
    }
  }
  return score;
}

export function getBotReply(question: string): BotReply {
  const text = normalise(question);
  if (!text) return { kind: "unknown", suggestions: [] };

  if (HUMAN_REQUEST.some((p) => text.includes(p))) return { kind: "escalate", reason: "asked" };
  if (NEEDS_PERSON.some((p) => text.includes(p))) return { kind: "escalate", reason: "complex" };

  const words = text.split(" ");
  const ranked = TOPICS.map((t) => ({ t, s: scoreTopic(text, words, t) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s); // stable: earlier topics win ties

  if (ranked.length && ranked[0].s >= 2) {
    return { kind: "answer", topic: ranked[0].t, related: ranked.slice(1, 3).map((r) => r.t) };
  }
  if (GREETING.test(text)) return { kind: "greeting" };
  if (THANKS.test(text)) return { kind: "thanks" };
  return { kind: "unknown", suggestions: ranked.slice(0, 3).map((r) => r.t) };
}
