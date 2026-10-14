// Mock API for withdrawals and rotating payouts (v4 §6). Pages hold their own state.

export type WithdrawalKind = "withdrawal" | "payout";
export type WithdrawalStatus =
  | "submitted"
  | "approved"
  | "scheduled"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled"
  | "held"
  | "rejected";

export interface Approval {
  stage: "maker" | "checker";
  by: string;
  decision: "approved" | "rejected";
  reason?: string;
  at: string;
}

export interface Withdrawal {
  id: string;
  kind: WithdrawalKind;
  member: string;
  group: string;
  amount: number;
  fullExit: boolean;
  payoutAccount: { bank: string; accountNumber: string; name: string };
  dueDate: string; // ISO date, executes 09:00 WAT
  status: WithdrawalStatus;
  createdBy: string;
  createdAt: string;
  approvals: Approval[];
  attempts: number;
  failReason?: string;
  fee: number;
  history: { at: string; text: string; by?: string }[];
  manual?: ManualDetails; // paid outside SaveCircle, no automatic transfer
}

export type ManualMethod = "cash" | "transfer" | "other";

export const MANUAL_METHOD: Record<ManualMethod, string> = {
  cash: "Cash",
  transfer: "Bank transfer",
  other: "Other",
};

export interface ManualDetails {
  method: ManualMethod;
  reference?: string;
  note?: string;
  paidAt?: string; // set once the money has actually gone out
}

export interface MemberBalance {
  member: string;
  group: string;
  savings: number;
  pending: number;
  firstDeposit: string;
  withdrawalsThisMonth: number;
  payoutAccounts: {
    bank: string;
    accountNumber: string;
    name: string;
    usableFrom: string;
  }[];
}

// Organisation policy (v4 §6.1). All placeholders the organisation sets.
export const POLICY = {
  noticeDays: 7,
  instantLimit: 20_000,
  lockInDays: 90,
  minBalance: 0,
  perMonth: 2,
  twoPersonAbove: 100_000,
};

export const CURRENT_USER = {
  name: "[Finance approver]",
  role: "finance_approver" as const,
}; // TODO: auth session

const iso = (daysFromNow: number, h = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

let WITHDRAWALS: Withdrawal[] = [
  {
    id: "w1",
    kind: "withdrawal",
    member: "[Member 1]",
    group: "[Church thrift]",
    amount: 85_000,
    fullExit: false,
    payoutAccount: {
      bank: "GTBank",
      accountNumber: "0123454321",
      name: "[MEMBER 1 FULL NAME]",
    },
    dueDate: iso(1),
    status: "scheduled",
    createdBy: "[Member 1]",
    createdAt: iso(-6, 14),
    approvals: [],
    attempts: 0,
    fee: 0,
    history: [
      { at: iso(-6, 14), text: "Notice submitted from the member app" },
      {
        at: iso(-6, 14),
        text: "Auto-approved: within limits, all policy checks passed",
      },
      { at: iso(-6, 14), text: "Scheduled for the due date" },
    ],
  },
  {
    id: "w2",
    kind: "withdrawal",
    member: "[Member 2]",
    group: "[Church thrift]",
    amount: 150_000,
    fullExit: false,
    payoutAccount: {
      bank: "Access Bank",
      accountNumber: "0098761234",
      name: "[MEMBER 2 FULL NAME]",
    },
    dueDate: iso(2),
    status: "submitted",
    createdBy: "[Officer 2]",
    createdAt: iso(-5, 11),
    approvals: [
      {
        stage: "maker",
        by: "[Officer 2]",
        decision: "approved",
        at: iso(-5, 11),
      },
    ],
    attempts: 0,
    fee: 0,
    history: [
      {
        at: iso(-5, 11),
        text: "Notice raised on behalf of the member",
        by: "[Officer 2]",
      },
      {
        at: iso(-5, 11),
        text: "Above ₦100,000, needs a second approval",
        by: "[Officer 2]",
      },
    ],
  },
  {
    id: "w3",
    kind: "payout",
    member: "[Member 4]",
    group: "[Market traders ajo]",
    amount: 60_000,
    fullExit: false,
    payoutAccount: {
      bank: "Opay",
      accountNumber: "8031234567",
      name: "[MEMBER 4 FULL NAME]",
    },
    dueDate: iso(2),
    status: "submitted",
    createdBy: "[Officer 1]",
    createdAt: iso(-1, 10),
    approvals: [
      {
        stage: "maker",
        by: "[Officer 1]",
        decision: "approved",
        at: iso(-1, 10),
      },
    ],
    attempts: 0,
    fee: 0,
    history: [
      {
        at: iso(-1, 10),
        text: "Cycle 4 fully funded, payout created automatically",
      },
      { at: iso(-1, 10), text: "Initiated (maker)", by: "[Officer 1]" },
    ],
  },
  {
    id: "w4",
    kind: "withdrawal",
    member: "[Member 5]",
    group: "[Church thrift]",
    amount: 15_000,
    fullExit: false,
    payoutAccount: {
      bank: "Moniepoint",
      accountNumber: "5012349876",
      name: "[MEMBER 5 FULL NAME]",
    },
    dueDate: iso(-1),
    status: "failed",
    createdBy: "[Member 5]",
    createdAt: iso(-1, 8),
    approvals: [],
    attempts: 1,
    fee: 0,
    failReason: "Receiving bank was unavailable",
    history: [
      {
        at: iso(-1, 8),
        text: "Notice submitted, under the instant limit so it runs today",
      },
      { at: iso(-1, 9), text: "Transfer sent" },
      {
        at: iso(-1, 9),
        text: "Transfer failed: receiving bank was unavailable. Retrying next morning.",
      },
    ],
  },
  {
    id: "w5",
    kind: "withdrawal",
    member: "[Member 7]",
    group: "[Church thrift]",
    amount: 40_000,
    fullExit: false,
    payoutAccount: {
      bank: "UBA",
      accountNumber: "2034567812",
      name: "[MEMBER 7 FULL NAME]",
    },
    dueDate: iso(-3),
    status: "completed",
    createdBy: "[Member 7]",
    createdAt: iso(-10, 12),
    approvals: [],
    attempts: 1,
    fee: 0,
    history: [
      { at: iso(-10, 12), text: "Notice submitted from the member app" },
      { at: iso(-10, 12), text: "Auto-approved and scheduled" },
      { at: iso(-3, 9), text: "Balance, payout account and float re-checked" },
      { at: iso(-3, 9), text: "Transfer completed, receipt sent" },
    ],
  },
  {
    id: "w6",
    kind: "withdrawal",
    member: "[Member 3]",
    group: "[Church thrift]",
    amount: 210_000,
    fullExit: true,
    payoutAccount: {
      bank: "Zenith Bank",
      accountNumber: "1012345678",
      name: "[MEMBER 3 FULL NAME]",
    },
    dueDate: iso(0),
    status: "held",
    createdBy: "[Member 3]",
    createdAt: iso(-7, 9),
    approvals: [
      {
        stage: "maker",
        by: "[Officer 2]",
        decision: "approved",
        at: iso(-6, 10),
      },
      {
        stage: "checker",
        by: "[Finance approver]",
        decision: "approved",
        at: iso(-5, 15),
      },
    ],
    attempts: 0,
    fee: 0,
    history: [
      {
        at: iso(-7, 9),
        text: "Full-balance notice submitted; member leaves the group after payment",
      },
      { at: iso(-5, 15), text: "Approved by maker and checker" },
      {
        at: iso(0, 9),
        text: "Held: the organisation's balance can't cover today's withdrawals. Finance alerted.",
      },
    ],
  },
];

const BALANCES: MemberBalance[] = [
  {
    member: "[Member 1]",
    group: "[Church thrift]",
    savings: 184_500,
    pending: 85_000,
    firstDeposit: iso(-200),
    withdrawalsThisMonth: 1,
    payoutAccounts: [
      {
        bank: "GTBank",
        accountNumber: "0123454321",
        name: "[MEMBER 1 FULL NAME]",
        usableFrom: iso(-100),
      },
    ],
  },
  {
    member: "[Member 6]",
    group: "[Church thrift]",
    savings: 46_000,
    pending: 0,
    firstDeposit: iso(-40),
    withdrawalsThisMonth: 0,
    payoutAccounts: [
      {
        bank: "Wema Bank",
        accountNumber: "0234567891",
        name: "[MEMBER 6 FULL NAME]",
        usableFrom: iso(-20),
      },
    ],
  },
  {
    member: "[Member 8]",
    group: "[Church thrift]",
    savings: 132_000,
    pending: 0,
    firstDeposit: iso(-300),
    withdrawalsThisMonth: 0,
    payoutAccounts: [
      {
        bank: "First Bank",
        accountNumber: "3012345670",
        name: "[MEMBER 8 FULL NAME]",
        usableFrom: iso(0, 23),
      },
    ],
  },
  {
    member: "[Member 9]",
    group: "[Church thrift]",
    savings: 18_000,
    pending: 0,
    firstDeposit: iso(-150),
    withdrawalsThisMonth: 0,
    payoutAccounts: [
      {
        bank: "Opay",
        accountNumber: "9038887766",
        name: "[MEMBER 9 FULL NAME]",
        usableFrom: iso(-60),
      },
    ],
  },
];

export const ORG_FLOAT = 300_000; // organisation account balance available for withdrawals. TODO: from provider

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const now = () => new Date().toISOString();

async function save(w: Withdrawal) {
  await wait(700);
  WITHDRAWALS = WITHDRAWALS.some((x) => x.id === w.id)
    ? WITHDRAWALS.map((x) => (x.id === w.id ? clone(w) : x))
    : [clone(w), ...WITHDRAWALS];
  return clone(w);
}

// TODO: GET /withdrawals
export async function listWithdrawals() {
  await wait(400);
  return clone(WITHDRAWALS);
}

// TODO: GET /withdrawals/:id
export async function getWithdrawal(id: string) {
  await wait(400);
  const w = WITHDRAWALS.find((x) => x.id === id);
  return w ? clone(w) : null;
}

// TODO: GET /members/balances?type=thrift
export async function listBalances() {
  await wait(300);
  return clone(BALANCES);
}

// Manual withdrawals are paid outside SaveCircle, so there's no transfer to approve
export const needsChecker = (
  w: Pick<Withdrawal, "amount" | "kind" | "manual">,
) => !w.manual && (w.kind === "payout" || w.amount > POLICY.twoPersonAbove);

// Policy checks shown in the form and on the details page (v4 §6.1, §6.4)
export function policyChecks(
  b: MemberBalance,
  amount: number,
  accountNumber: string,
) {
  const available = b.savings - b.pending;
  const lockInEnds = new Date(
    new Date(b.firstDeposit).getTime() + POLICY.lockInDays * 86_400_000,
  );
  const account = b.payoutAccounts.find(
    (a) => a.accountNumber === accountNumber,
  );
  return [
    {
      label: `Within available balance (${"₦" + available.toLocaleString("en-NG")})`,
      ok: amount > 0 && amount <= available - POLICY.minBalance,
    },
    {
      label: `Lock-in of ${POLICY.lockInDays} days has ended`,
      ok: lockInEnds.getTime() <= Date.now(),
    },
    {
      label: `Fewer than ${POLICY.perMonth} withdrawals this month`,
      ok: b.withdrawalsThisMonth < POLICY.perMonth,
    },
    {
      label: "Payout account past its 24-hour cooling period",
      ok: !!account && new Date(account.usableFrom).getTime() <= Date.now(),
    },
  ];
}

// TODO: POST /withdrawals
export async function createWithdrawal(input: {
  balance: MemberBalance;
  amount: number;
  fullExit: boolean;
  accountNumber: string;
  by: string;
}) {
  const { balance: b, amount, fullExit, accountNumber, by } = input;
  const instant = amount <= POLICY.instantLimit;
  const due = new Date();
  if (!instant) due.setDate(due.getDate() + POLICY.noticeDays);
  due.setHours(9, 0, 0, 0);
  const id = `w${Date.now()}`;
  const checker = amount > POLICY.twoPersonAbove;
  const w: Withdrawal = {
    id,
    kind: "withdrawal",
    member: b.member,
    group: b.group,
    amount,
    fullExit,
    payoutAccount: b.payoutAccounts.find(
      (a) => a.accountNumber === accountNumber,
    )!,
    dueDate: due.toISOString(),
    status: checker ? "submitted" : "scheduled",
    createdBy: by,
    createdAt: now(),
    approvals: checker
      ? [{ stage: "maker", by, decision: "approved", at: now() }]
      : [],
    attempts: 0,
    fee: 0,
    history: [
      { at: now(), text: "Notice raised on behalf of the member", by },
      {
        at: now(),
        text: checker
          ? `Above ${"₦" + POLICY.twoPersonAbove.toLocaleString("en-NG")}, needs a second approval`
          : "Auto-approved: within limits, all policy checks passed",
      },
      ...(fullExit
        ? [
            {
              at: now(),
              text: "Full balance: member exit from the group is scheduled",
            },
          ]
        : []),
    ],
  };
  const idx = BALANCES.findIndex((x) => x.member === b.member);
  if (idx >= 0)
    BALANCES[idx] = {
      ...BALANCES[idx],
      pending: BALANCES[idx].pending + amount,
      withdrawalsThisMonth: BALANCES[idx].withdrawalsThisMonth + 1,
    };
  return save(w);
}

// TODO: POST /withdrawals/:id/approve. The checker can never be the maker.
export async function approve(w: Withdrawal, by: string) {
  return save({
    ...w,
    status: "scheduled",
    approvals: [
      ...w.approvals,
      { stage: "checker", by, decision: "approved", at: now() },
    ],
    history: [
      ...w.history,
      {
        at: now(),
        text: "Second approval given, scheduled for the due date",
        by,
      },
    ],
  });
}

// TODO: POST /withdrawals/:id/reject
export async function reject(w: Withdrawal, by: string, reason: string) {
  return save({
    ...w,
    status: "rejected",
    approvals: [
      ...w.approvals,
      { stage: "checker", by, decision: "rejected", reason, at: now() },
    ],
    history: [...w.history, { at: now(), text: `Rejected: ${reason}`, by }],
  });
}

// TODO: POST /withdrawals/:id/cancel. Allowed until execution starts.
export async function cancel(w: Withdrawal, by: string, reason: string) {
  return save({
    ...w,
    status: "cancelled",
    history: [...w.history, { at: now(), text: `Cancelled: ${reason}`, by }],
  });
}

// TODO: POST /withdrawals/:id/retry (same withdrawal ID is the idempotency key)
export async function retry(w: Withdrawal, by: string) {
  return save({
    ...w,
    status: "scheduled",
    failReason: undefined,
    history: [
      ...w.history,
      { at: now(), text: "Retry scheduled for 09:00 tomorrow", by },
    ],
  });
}

// TODO: POST /withdrawals/manual
// Records a withdrawal paid outside SaveCircle (cash, the organisation's own
// bank app, ...). SaveCircle never sends money for these; it only keeps the
// member's balance and history right.
export async function recordManualWithdrawal(input: {
  balance: MemberBalance;
  amount: number;
  fullExit: boolean;
  method: ManualMethod;
  date: string; // ISO: when it was paid, or when it will be
  alreadyPaid: boolean;
  accountNumber?: string; // bank transfers only
  reference?: string;
  note?: string;
  by: string;
}) {
  const { balance: b, amount, method, date, alreadyPaid, by } = input;
  const account =
    method === "transfer"
      ? b.payoutAccounts.find((a) => a.accountNumber === input.accountNumber)
      : undefined;
  const how = MANUAL_METHOD[method].toLowerCase();
  const w: Withdrawal = {
    id: `w${Date.now()}`,
    kind: "withdrawal",
    member: b.member,
    group: b.group,
    amount,
    fullExit: input.fullExit,
    payoutAccount: account ?? {
      bank: MANUAL_METHOD[method],
      accountNumber: "",
      name: b.member,
    },
    dueDate: date,
    status: alreadyPaid ? "completed" : "scheduled",
    createdBy: by,
    createdAt: now(),
    approvals: [],
    attempts: 0,
    fee: 0,
    manual: {
      method,
      reference: input.reference || undefined,
      note: input.note || undefined,
      paidAt: alreadyPaid ? date : undefined,
    },
    history: [
      {
        at: now(),
        text: alreadyPaid
          ? `Recorded as already paid by ${how}`
          : `Manual withdrawal scheduled, to be paid by ${how}`,
        by,
      },
      ...(input.fullExit
        ? [{ at: now(), text: "Full balance: member exit from the group is scheduled" }]
        : []),
      ...(alreadyPaid
        ? [{ at: now(), text: "Member balance updated, receipt sent" }]
        : []),
    ],
  };
  const idx = BALANCES.findIndex((x) => x.member === b.member);
  if (idx >= 0)
    BALANCES[idx] = {
      ...BALANCES[idx],
      ...(alreadyPaid
        ? { savings: BALANCES[idx].savings - amount }
        : { pending: BALANCES[idx].pending + amount }),
      withdrawalsThisMonth: BALANCES[idx].withdrawalsThisMonth + 1,
    };
  return save(w);
}

// TODO: POST /withdrawals/:id/mark-paid (manual withdrawals only)
export async function markManualPaid(
  w: Withdrawal,
  by: string,
  reference?: string,
) {
  const idx = BALANCES.findIndex((x) => x.member === w.member);
  if (idx >= 0)
    BALANCES[idx] = {
      ...BALANCES[idx],
      savings: BALANCES[idx].savings - w.amount,
      pending: Math.max(0, BALANCES[idx].pending - w.amount),
    };
  return save({
    ...w,
    status: "completed",
    manual: {
      method: w.manual?.method ?? "other",
      ...w.manual,
      reference: reference || w.manual?.reference,
      paidAt: now(),
    },
    history: [
      ...w.history,
      {
        at: now(),
        text: `Marked as paid outside SaveCircle${reference ? ` (ref ${reference})` : ""}`,
        by,
      },
      { at: now(), text: "Member balance updated, receipt sent" },
    ],
  });
}
