// Mock API for payments. Pages keep their own state and call these like a backend.
// Shapes follow v4 §5 and §8.2 (Payment, Contribution, MemberCredit, AuditLog).

export type Channel = "transfer" | "cash";
export type MatchStatus =
  | "matched"
  | "credit"
  | "unmatched"
  | "reversed"
  | "reversal_pending"
  | "refund_pending";
export type AllocationKind = "arrears" | "current" | "thrift" | "credit";

// Display labels for each status
export const STATUS: Record<
  MatchStatus,
  { label: string; tone: "success" | "warning" | "info" | "neutral" }
> = {
  matched: { label: "Matched", tone: "success" },
  credit: { label: "Matched + credit", tone: "info" },
  unmatched: { label: "Unmatched", tone: "warning" },
  reversed: { label: "Reversed", tone: "neutral" },
  reversal_pending: { label: "Reversal pending", tone: "warning" },
  refund_pending: { label: "Refund pending", tone: "warning" },
};

export interface Allocation {
  group: string;
  cycle?: string;
  kind: AllocationKind;
  amount: number;
}

export interface AuditEntry {
  at: string;
  text: string;
  by?: string;
}

export interface Payment {
  id: string;
  receivedAt: string; // ISO
  amount: number;
  channel: Channel;
  status: MatchStatus;
  member?: string;
  memberPhone?: string;
  accountNumber?: string; // the virtual account it landed in
  accountOwner: "member" | "organisation";
  senderName?: string;
  narration?: string;
  providerRef?: string;
  loggedBy?: string; // cash only
  allocations: Allocation[];
  receiptSentAt?: string;
  audit: AuditEntry[];
  fromUnmatched?: boolean; // entered the Unmatched queue (v4 §5.3)
  resolvedAt?: string;
  refundTo?: { bank: string; accountNumber: string; accountName: string };
}

export interface DirectoryMember {
  name: string;
  phone: string;
  groups: string[];
  accountNumber?: string;
  verified: boolean;
}

const today = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const daysAgo = (n: number, h = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const transferAudit = (at: string): AuditEntry[] => [
  { at, text: "Webhook received, signature checked" },
  { at, text: "Re-verified with provider" },
  { at, text: "Matched to member and allocated" },
  { at, text: "Receipt sent by WhatsApp" },
];

let PAYMENTS: Payment[] = [
  {
    id: "p1",
    receivedAt: today(10, 42),
    amount: 5000,
    channel: "transfer",
    status: "matched",
    member: "[Member 1]",
    memberPhone: "08031234567",
    accountNumber: "9012345671",
    accountOwner: "member",
    senderName: "[MEMBER 1 FULL NAME]",
    narration: "ajo",
    providerRef: "PSK_8f2a91c0",
    allocations: [
      { group: "[Market traders thrift]", kind: "thrift", amount: 5000 },
    ],
    receiptSentAt: today(10, 42),
    audit: transferAudit(today(10, 42)),
  },
  {
    id: "p2",
    receivedAt: today(10, 31),
    amount: 12000,
    channel: "transfer",
    status: "credit",
    member: "[Member 2]",
    memberPhone: "08059876543",
    accountNumber: "9012345672",
    accountOwner: "member",
    senderName: "[MEMBER 2 FULL NAME]",
    narration: "contribution",
    providerRef: "PSK_77b1e4d2",
    allocations: [
      {
        group: "[Weekly ajo]",
        cycle: "Cycle 3",
        kind: "arrears",
        amount: 5000,
      },
      {
        group: "[Weekly ajo]",
        cycle: "Cycle 4",
        kind: "current",
        amount: 5000,
      },
      { group: "Member credit", kind: "credit", amount: 2000 },
    ],
    receiptSentAt: today(10, 31),
    audit: transferAudit(today(10, 31)),
  },
  {
    id: "p3",
    receivedAt: today(10, 15),
    amount: 20000,
    channel: "transfer",
    status: "unmatched",
    fromUnmatched: true,
    accountNumber: "9000000001",
    accountOwner: "organisation",
    senderName: "[SENDER NAME]",
    narration: "ajo mama T",
    providerRef: "PSK_19ce0a77",
    allocations: [],
    audit: [
      { at: today(10, 15), text: "Webhook received, signature checked" },
      { at: today(10, 15), text: "Re-verified with provider" },
      {
        at: today(10, 15),
        text: "Paid into the organisation account, added to the Unmatched queue",
      },
    ],
  },
  {
    id: "p4",
    receivedAt: today(9, 58),
    amount: 10000,
    channel: "cash",
    status: "matched",
    member: "[Member 4]",
    memberPhone: "08124445566",
    accountOwner: "member",
    loggedBy: "[Officer 2]",
    allocations: [
      {
        group: "[Weekly ajo]",
        cycle: "Cycle 4",
        kind: "current",
        amount: 5000,
      },
      {
        group: "[Weekly ajo]",
        cycle: "Cycle 5",
        kind: "current",
        amount: 5000,
      },
    ],
    receiptSentAt: today(9, 58),
    audit: [
      { at: today(9, 58), text: "Cash logged", by: "[Officer 2]" },
      { at: today(9, 58), text: "Allocated across cycles" },
      { at: today(9, 58), text: "Receipt sent by SMS" },
      { at: today(9, 58), text: "Added to officer's cash in hand" },
    ],
  },
  {
    id: "p5",
    receivedAt: today(9, 40),
    amount: 3500,
    channel: "transfer",
    status: "matched",
    member: "[Member 5]",
    memberPhone: "09037778899",
    accountNumber: "9012345675",
    accountOwner: "member",
    senderName: "[MEMBER 5 FULL NAME]",
    providerRef: "PSK_a0d93f11",
    allocations: [
      { group: "[Market traders thrift]", kind: "thrift", amount: 3500 },
    ],
    receiptSentAt: today(9, 40),
    audit: transferAudit(today(9, 40)),
  },
  {
    id: "p6",
    receivedAt: daysAgo(4),
    amount: 15000,
    channel: "transfer",
    status: "unmatched",
    fromUnmatched: true,
    accountNumber: "9012345676",
    accountOwner: "member",
    senderName: "[SENDER NAME]",
    narration: "savings",
    providerRef: "PSK_c4e8b2a0",
    allocations: [],
    audit: [
      { at: daysAgo(4), text: "Webhook received, signature checked" },
      {
        at: daysAgo(4),
        text: "Paid into a blocked member account, added to the Unmatched queue",
      },
      {
        at: daysAgo(1),
        text: "Older than 3 days, escalated to the branch manager",
      },
    ],
  },
  {
    id: "p7",
    receivedAt: daysAgo(2),
    amount: 20000,
    channel: "transfer",
    status: "matched",
    member: "[Member 7]",
    memberPhone: "08022223344",
    accountNumber: "9012345677",
    accountOwner: "member",
    senderName: "[MEMBER 7 FULL NAME]",
    providerRef: "PSK_5b7d1e93",
    allocations: [
      {
        group: "[Teachers circle]",
        cycle: "Cycle 7",
        kind: "current",
        amount: 20000,
      },
    ],
    receiptSentAt: daysAgo(2),
    audit: transferAudit(daysAgo(2)),
  },
  {
    id: "p8",
    receivedAt: daysAgo(12),
    amount: 6000,
    channel: "cash",
    status: "reversed",
    member: "[Member 8]",
    memberPhone: "08065554433",
    accountOwner: "member",
    loggedBy: "[Officer 1]",
    allocations: [],
    audit: [
      { at: daysAgo(12), text: "Cash logged", by: "[Officer 1]" },
      {
        at: daysAgo(11),
        text: "Reversed: logged against the wrong member",
        by: "[Officer 1]",
      },
    ],
  },
];

PAYMENTS = [
  ...PAYMENTS,
  {
    id: "p9",
    receivedAt: daysAgo(1, 16),
    amount: 10000,
    channel: "transfer",
    status: "unmatched",
    fromUnmatched: true,
    accountNumber: "9000000001",
    accountOwner: "organisation",
    senderName: "[BELLO TOLA A]",
    narration: "thrift oct",
    providerRef: "PSK_2d81aa04",
    allocations: [],
    audit: [
      { at: daysAgo(1, 16), text: "Webhook received, signature checked" },
      { at: daysAgo(1, 16), text: "Re-verified with provider" },
      {
        at: daysAgo(1, 16),
        text: "Paid into the organisation account, added to the Unmatched queue",
      },
    ],
  },
  {
    id: "p10",
    receivedAt: daysAgo(5, 9),
    amount: 2500,
    channel: "transfer",
    status: "unmatched",
    fromUnmatched: true,
    accountNumber: "9000000001",
    accountOwner: "organisation",
    senderName: "[OKAFOR NGOZI]",
    narration: "levy",
    providerRef: "PSK_9a0c73be",
    allocations: [],
    audit: [
      { at: daysAgo(5, 9), text: "Webhook received, signature checked" },
      {
        at: daysAgo(5, 9),
        text: "Paid into the organisation account, added to the Unmatched queue",
      },
      {
        at: daysAgo(2, 9),
        text: "Older than 3 days, escalated to the branch manager",
      },
    ],
  },
  {
    id: "p11",
    receivedAt: daysAgo(3, 11),
    amount: 5000,
    channel: "transfer",
    status: "matched",
    fromUnmatched: true,
    resolvedAt: daysAgo(2, 15),
    member: "[Ade Musa]",
    accountNumber: "9000000001",
    accountOwner: "organisation",
    senderName: "[MUSA ADEWALE]",
    narration: "ajo",
    providerRef: "PSK_4be0c118",
    allocations: [
      {
        group: "[Weekly ajo]",
        cycle: "Cycle 4",
        kind: "current",
        amount: 5000,
      },
    ],
    receiptSentAt: daysAgo(2, 15),
    audit: [
      {
        at: daysAgo(3, 11),
        text: "Paid into the organisation account, added to the Unmatched queue",
      },
      {
        at: daysAgo(2, 15),
        text: "Assigned to [Ade Musa]: sender name matches, confirmed by phone",
        by: "[Officer 2]",
      },
      { at: daysAgo(2, 15), text: "Receipt sent by WhatsApp" },
    ],
  },
];

// Member directory used for matching. TODO: GET /members?search=
export const DIRECTORY: DirectoryMember[] = [
  {
    name: "[Tola Bello]",
    phone: "08031112222",
    groups: ["[Market traders thrift]", "[Weekly ajo]"],
    accountNumber: "9012345681",
    verified: true,
  },
  {
    name: "[Ngozi Okafor]",
    phone: "08052223333",
    groups: ["[Church thrift]"],
    verified: false,
  },
  {
    name: "[Ade Musa]",
    phone: "07063334444",
    groups: ["[Weekly ajo]"],
    accountNumber: "9012345683",
    verified: true,
  },
  {
    name: "[Member 1]",
    phone: "08031234567",
    groups: ["[Market traders thrift]"],
    accountNumber: "9012345671",
    verified: true,
  },
  {
    name: "[Member 2]",
    phone: "08059876543",
    groups: ["[Weekly ajo]"],
    accountNumber: "9012345672",
    verified: true,
  },
  {
    name: "[Member 7]",
    phone: "08022223344",
    groups: ["[Teachers circle]"],
    accountNumber: "9012345677",
    verified: true,
  },
];

export const MEMBERS = DIRECTORY.map((m) => m.name);

// TODO: GET /unmatched
export async function listUnmatched(): Promise<Payment[]> {
  await wait(400);
  return clone(PAYMENTS.filter((p) => p.fromUnmatched));
}

// TODO: GET /banks/resolve?bank=&account= (name enquiry, v4 §2.2)
export async function resolveAccountName(
  bank: string,
  accountNumber: string,
): Promise<string> {
  await wait(800);
  if (!bank || !/^\d{10}$/.test(accountNumber))
    throw new Error("Pick a bank and enter a 10-digit account number.");
  if (accountNumber.endsWith("0000"))
    throw new Error("No account found. Check the number and bank.");
  return "[ACCOUNT HOLDER NAME]";
}

export const BANKS = [
  "Access Bank",
  "First Bank",
  "GTBank",
  "Opay",
  "Moniepoint",
  "UBA",
  "Wema Bank",
  "Zenith Bank",
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

// TODO: GET /payments
export async function listPayments(): Promise<Payment[]> {
  await wait(400);
  return clone(PAYMENTS);
}

// TODO: GET /payments/:id
export async function getPayment(id: string): Promise<Payment | null> {
  await wait(400);
  const p = PAYMENTS.find((x) => x.id === id);
  return p ? clone(p) : null;
}

// Mock persistence so changes survive navigating between the two pages
async function save(p: Payment) {
  await wait(700);
  PAYMENTS = PAYMENTS.map((x) => (x.id === p.id ? clone(p) : x));
  return clone(p);
}

const stamp = () => new Date().toISOString();

// TODO: POST /payments/:id/assign  (written to the AuditLog)
export async function assignPayment(
  p: Payment,
  member: string,
  group: string,
  reason: string,
  by: string,
) {
  return save({
    ...p,
    status: "matched",
    member,
    resolvedAt: p.fromUnmatched ? stamp() : p.resolvedAt,
    allocations: [{ group, kind: "current", amount: p.amount }],
    receiptSentAt: stamp(),
    audit: [
      ...p.audit,
      { at: stamp(), text: `Assigned to ${member}: ${reason}`, by },
      { at: stamp(), text: "Receipt sent by WhatsApp" },
    ],
  });
}

// TODO: POST /payments/:id/refund
export async function markForRefund(
  p: Payment,
  reason: string,
  by: string,
  refundTo?: Payment["refundTo"],
) {
  const to = refundTo ? ` to ${refundTo.accountName}, ${refundTo.bank}` : "";
  return save({
    ...p,
    status: "refund_pending",
    refundTo,
    resolvedAt: stamp(),
    audit: [
      ...p.audit,
      { at: stamp(), text: `Marked for refund${to}: ${reason}`, by },
      { at: stamp(), text: "Refund sent for approval" },
    ],
  });
}

// TODO: POST /payments/:id/reverse. Transfer-funded reversals need a checker (v4 §9).
export async function reversePayment(p: Payment, reason: string, by: string) {
  const needsChecker = p.channel === "transfer";
  return save({
    ...p,
    status: needsChecker ? "reversal_pending" : "reversed",
    allocations: needsChecker ? p.allocations : [],
    audit: [
      ...p.audit,
      {
        at: stamp(),
        text: needsChecker
          ? `Reversal requested, waiting for a checker: ${reason}`
          : `Reversed: ${reason}`,
        by,
      },
    ],
  });
}

// TODO: POST /payments/:id/receipt
export async function resendReceipt(p: Payment) {
  return save({
    ...p,
    receiptSentAt: stamp(),
    audit: [...p.audit, { at: stamp(), text: "Receipt re-sent" }],
  });
}
