// Mock API for officer cash in hand (v4 §5.4). Pages hold their own state.
// Cash in hand = cash logged − cash deposited to the organisation account.

export interface CashEntry {
  id: string;
  member: string;
  group: string;
  amount: number;
  remaining: number; // not yet banked
  loggedAt: string;
}

export interface Deposit {
  id: string;
  amount: number;
  at: string;
  reference: string;
}

export interface Officer {
  id: string;
  name: string;
  branch: string;
  phone: string;
  entries: CashEntry[];
  deposits: Deposit[];
  lastReminderAt?: string;
}

export const FLAG_AFTER_HOURS = 48;

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3_600_000).toISOString();

let OFFICERS: Officer[] = [
  {
    id: "o1",
    name: "[Officer 1]",
    branch: "[Branch A]",
    phone: "08030001111",
    entries: [
      {
        id: "c1",
        member: "[Member 5]",
        group: "[Artisans weekly]",
        amount: 3000,
        remaining: 3000,
        loggedAt: hoursAgo(55),
      },
      {
        id: "c2",
        member: "[Member 8]",
        group: "[Market traders ajo]",
        amount: 25000,
        remaining: 25000,
        loggedAt: hoursAgo(52),
      },
      {
        id: "c3",
        member: "[Member 9]",
        group: "[Market traders ajo]",
        amount: 30000,
        remaining: 30000,
        loggedAt: hoursAgo(26),
      },
      {
        id: "c4",
        member: "[Member 2]",
        group: "[Market traders ajo]",
        amount: 5000,
        remaining: 0,
        loggedAt: hoursAgo(80),
      },
    ],
    deposits: [
      {
        id: "d1",
        amount: 5000,
        at: hoursAgo(72),
        reference: "Transfer from officer, PSK_11ab",
      },
    ],
  },
  {
    id: "o2",
    name: "[Officer 2]",
    branch: "[Branch A]",
    phone: "08030002222",
    entries: [
      {
        id: "c5",
        member: "[Member 4]",
        group: "[Weekly ajo]",
        amount: 10000,
        remaining: 10000,
        loggedAt: hoursAgo(3),
      },
      {
        id: "c6",
        member: "[Member 11]",
        group: "[Church thrift]",
        amount: 2000,
        remaining: 2000,
        loggedAt: hoursAgo(5),
      },
      {
        id: "c7",
        member: "[Member 12]",
        group: "[Church thrift]",
        amount: 35700,
        remaining: 35700,
        loggedAt: hoursAgo(20),
      },
    ],
    deposits: [
      {
        id: "d2",
        amount: 48000,
        at: hoursAgo(30),
        reference: "Branch deposit slip 0042",
      },
    ],
  },
  {
    id: "o3",
    name: "[Officer 3]",
    branch: "[Branch B]",
    phone: "08030003333",
    entries: [
      {
        id: "c8",
        member: "[Member 14]",
        group: "[Teachers circle]",
        amount: 20000,
        remaining: 20000,
        loggedAt: hoursAgo(8),
      },
      {
        id: "c9",
        member: "[Member 15]",
        group: "[Teachers circle]",
        amount: 20500,
        remaining: 20500,
        loggedAt: hoursAgo(6),
      },
    ],
    deposits: [],
  },
  {
    id: "o4",
    name: "[Officer 4]",
    branch: "[Branch B]",
    phone: "08030004444",
    entries: [
      {
        id: "c10",
        member: "[Member 20]",
        group: "[Teachers circle]",
        amount: 15000,
        remaining: 0,
        loggedAt: hoursAgo(40),
      },
    ],
    deposits: [
      {
        id: "d3",
        amount: 15000,
        at: hoursAgo(36),
        reference: "Transfer from officer, PSK_98fe",
      },
    ],
  },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

export const cashInHand = (o: Officer) =>
  o.entries.reduce((s, e) => s + e.remaining, 0);
export const ageHours = (iso: string) =>
  (Date.now() - new Date(iso).getTime()) / 3_600_000;
export const oldestUnbanked = (o: Officer) =>
  o.entries
    .filter((e) => e.remaining > 0)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))[0];
export const isFlagged = (o: Officer) => {
  const oldest = oldestUnbanked(o);
  return !!oldest && ageHours(oldest.loggedAt) > FLAG_AFTER_HOURS;
};

// TODO: GET /cash-in-hand
export async function listOfficers() {
  await wait(400);
  return clone(OFFICERS);
}

// TODO: GET /cash-in-hand/:officerId
export async function getOfficer(id: string) {
  await wait(400);
  const o = OFFICERS.find((x) => x.id === id);
  return o ? clone(o) : null;
}

// Normally a deposit to the organisation account clears cash in hand automatically.
// This records one manually (e.g. a branch deposit slip). Clears oldest cash first.
// TODO: POST /cash-in-hand/:officerId/deposits
export async function recordDeposit(
  o: Officer,
  amount: number,
  reference: string,
) {
  await wait(700);
  let left = amount;
  const entries = [...o.entries]
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
    .map((e) => {
      const take = Math.min(e.remaining, left);
      left -= take;
      return { ...e, remaining: e.remaining - take };
    });
  const next: Officer = {
    ...o,
    entries,
    deposits: [
      { id: `d${Date.now()}`, amount, at: new Date().toISOString(), reference },
      ...o.deposits,
    ],
  };
  OFFICERS = OFFICERS.map((x) => (x.id === o.id ? clone(next) : x));
  return clone(next);
}

// TODO: POST /cash-in-hand/:officerId/remind (SMS/WhatsApp)
export async function sendReminder(o: Officer) {
  await wait(600);
  const next = { ...o, lastReminderAt: new Date().toISOString() };
  OFFICERS = OFFICERS.map((x) => (x.id === o.id ? clone(next) : x));
  return clone(next);
}
