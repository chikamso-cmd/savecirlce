import { useSyncExternalStore } from "react";

export type GroupType = "rotating" | "thrift";
export type Frequency = "Daily" | "Weekly" | "Monthly";
export type RotationOrder = "join" | "history" | "random" | "manual";

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  branch: string;
  officer: string;
  amount: number;
  frequency: Frequency;
  memberCount: number;
  arrearsCount: number;
  status: "active" | "paused" | "invites_sent";
  // rotating
  cycle?: number;
  cycles?: number;
  nextPayout?: string;
  // thrift
  balance?: number;
  noticePeriod?: string;
}

export interface NewMember {
  name: string;
  phone: string;
}

export interface NewGroupInput {
  type: GroupType;
  name: string;
  branch: string;
  officer: string;
  amount: number;
  frequency: Frequency;
  firstDueDate: string;
  rotationOrder: RotationOrder;
  requireGuarantor: boolean;
  noticePeriod: string;
  members: NewMember[];
}

// Placeholders: load these from your API
export const BRANCHES = ["[Branch A]", "[Branch B]"];
export const OFFICERS = ["[Officer 1]", "[Officer 2]", "[Officer 3]"];

const SAMPLE: Group[] = [
  {
    id: "g1",
    name: "[Market traders ajo]",
    type: "rotating",
    branch: "[Branch A]",
    officer: "[Officer 1]",
    amount: 5000,
    frequency: "Weekly",
    memberCount: 12,
    arrearsCount: 2,
    status: "active",
    cycle: 4,
    cycles: 12,
    nextPayout: "Fri 9 Oct",
  },
  {
    id: "g2",
    name: "[Church thrift]",
    type: "thrift",
    branch: "[Branch A]",
    officer: "[Officer 2]",
    amount: 2000,
    frequency: "Daily",
    memberCount: 38,
    arrearsCount: 5,
    status: "active",
    balance: 1840500,
    noticePeriod: "7 days",
  },
  {
    id: "g3",
    name: "[Teachers circle]",
    type: "rotating",
    branch: "[Branch B]",
    officer: "[Officer 3]",
    amount: 20000,
    frequency: "Monthly",
    memberCount: 10,
    arrearsCount: 0,
    status: "active",
    cycle: 7,
    cycles: 10,
    nextPayout: "Thu 29 Oct",
  },
  {
    id: "g4",
    name: "[Artisans weekly]",
    type: "rotating",
    branch: "[Branch B]",
    officer: "[Officer 1]",
    amount: 3000,
    frequency: "Weekly",
    memberCount: 8,
    arrearsCount: 3,
    status: "paused",
    cycle: 2,
    cycles: 8,
  },
];

export const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const STORAGE_KEY = "savecircle.groups";

function load(): Group[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Group[];
  } catch {
    // Storage unavailable or corrupt: fall back to sample data
  }
  return SAMPLE;
}

// Module-level store shared by every useGroups() caller and persisted to
// localStorage, so no provider is needed and groups survive a refresh.
let groups: Group[] = load();
const listeners = new Set<() => void>();

function setGroups(next: Group[]) {
  groups = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode: in-memory state still updates
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function createGroup(input: NewGroupInput): Promise<Group> {
  const n = input.members.length;
  const group: Group = {
    id: crypto.randomUUID(),
    name: input.name,
    type: input.type,
    branch: input.branch,
    officer: input.officer,
    amount: input.amount,
    frequency: input.frequency,
    memberCount: n,
    arrearsCount: 0,
    status: "invites_sent",
    ...(input.type === "rotating"
      ? {
          cycle: 1,
          cycles: n,
          nextPayout: new Date(input.firstDueDate).toLocaleDateString(
            "en-NG",
            { weekday: "short", day: "numeric", month: "short" },
          ),
        }
      : { balance: 0, noticePeriod: input.noticePeriod }),
  };
  setGroups([group, ...groups]);
  return group;
}

export function useGroups() {
  const current = useSyncExternalStore(subscribe, () => groups);
  return { groups: current, createGroup };
}
