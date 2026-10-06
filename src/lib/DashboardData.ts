// Sample data shaped like the API responses. Replace with real fetches in page.tsx.
import {
  ArrowLeftRight,
  BarChart3,
  CircleHelp,
  LayoutDashboard,
  Scale,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
  Wallet,
  Banknote,
  type LucideIcon,
} from "lucide-react";

export type Tone = "success" | "warning" | "info" | "neutral";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}
export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/groups", label: "Groups", icon: UsersRound },
      { href: "/members", label: "Members", icon: Users },
    ],
  },
  {
    title: "Money",
    items: [
      { href: "/payments", label: "Payments", icon: ArrowLeftRight },
      { href: "/unmatched", label: "Unmatched", icon: CircleHelp, badge: 3 },
      {
        href: "/withdrawals",
        label: "Withdrawals & payouts",
        icon: Banknote,
        badge: 2,
      },
      { href: "/cash", label: "Cash in hand", icon: Wallet },
      {
        href: "/reconciliation",
        label: "Reconciliation",
        icon: Scale,
        badge: 1,
      },
    ],
  },
  {
    title: "Organisation",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/team", label: "Team & roles", icon: ShieldCheck },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const organisation = {
  name: "[Organisation name]",
  type: "Cooperative",
  role: "Admin",
  branches: ["[Branch A]", "[Branch B]"],
  collectionAccount: {
    number: "0123456789",
    bank: "[Issuing bank]",
    name: "[Organisation name]",
  },
};

export const currentUser = {
  name: "[Admin name]",
  initials: "AD",
  role: "Admin",
};

export const stats: {
  label: string;
  value: string;
  note: string;
  tone: Tone;
  href: string;
}[] = [
  {
    label: "Collected today",
    value: "₦1,284,500",
    note: "82% by transfer",
    tone: "success",
    href: "/payments",
  },
  {
    label: "Arrears",
    value: "₦312,000",
    note: "27 members behind",
    tone: "warning",
    href: "/members?filter=arrears",
  },
  {
    label: "Cash in hand",
    value: "₦146,200",
    note: "1 officer over 48h",
    tone: "warning",
    href: "/cash",
  },
  {
    label: "Unmatched payments",
    value: "3",
    note: "₦41,000 to assign",
    tone: "info",
    href: "/unmatched",
  },
  {
    label: "Withdrawals this week",
    value: "₦520,000",
    note: "2 awaiting approval",
    tone: "info",
    href: "/withdrawals",
  },
];

// [transfer, cash] in thousands of naira
export const collections = [
  { day: "22 Sep", transfer: 42, cash: 10 },
  { day: "23 Sep", transfer: 38, cash: 14 },
  { day: "24 Sep", transfer: 55, cash: 9 },
  { day: "25 Sep", transfer: 47, cash: 16 },
  { day: "26 Sep", transfer: 60, cash: 12 },
  { day: "27 Sep", transfer: 30, cash: 22 },
  { day: "28 Sep", transfer: 18, cash: 8 },
  { day: "29 Sep", transfer: 64, cash: 10 },
  { day: "30 Sep", transfer: 58, cash: 12 },
  { day: "1 Oct", transfer: 70, cash: 9 },
  { day: "2 Oct", transfer: 52, cash: 15 },
  { day: "3 Oct", transfer: 66, cash: 11 },
  { day: "4 Oct", transfer: 35, cash: 18 },
  { day: "5 Oct", transfer: 74, cash: 8 },
];

export const attention = [
  {
    id: "a1",
    count: 2,
    title: "Withdrawals awaiting second approval",
    detail: "Due in 2 days. They won't go out unapproved.",
    action: "Review",
    href: "/withdrawals?status=needs_checker",
  },
  {
    id: "a2",
    count: 3,
    title: "Unmatched payments",
    detail: "1 is older than 3 days and has gone to the branch manager.",
    action: "Assign",
    href: "/unmatched",
  },
  {
    id: "a3",
    count: 1,
    title: "Cash not banked for over 48 hours",
    detail: "[Officer 1] is holding ₦58,000.",
    action: "Follow up",
    href: "/cash",
  },
  {
    id: "a4",
    count: 1,
    title: "Reconciliation exception",
    detail:
      "Last night's provider report has a transfer missing from the ledger.",
    action: "Resolve",
    href: "/reconciliation",
  },
];

export const officers = [
  {
    id: "o1",
    name: "[Officer 1]",
    initials: "O1",
    amount: "₦58,000",
    age: "Collected 2 days ago",
    overdue: true,
  },
  {
    id: "o2",
    name: "[Officer 2]",
    initials: "O2",
    amount: "₦47,700",
    age: "Collected today",
    overdue: false,
  },
  {
    id: "o3",
    name: "[Officer 3]",
    initials: "O3",
    amount: "₦40,500",
    age: "Collected today",
    overdue: false,
  },
];

export const withdrawals = [
  {
    id: "w1",
    weekday: "Tue",
    date: "6",
    member: "[Member name]",
    status: "Scheduled",
    tone: "success" as Tone,
    amount: "₦85,000",
  },
  {
    id: "w2",
    weekday: "Wed",
    date: "7",
    member: "[Member name]",
    status: "Needs checker",
    tone: "warning" as Tone,
    amount: "₦150,000",
  },
  {
    id: "w3",
    weekday: "Wed",
    date: "7",
    member: "[Member name]",
    status: "Needs checker",
    tone: "warning" as Tone,
    amount: "₦210,000",
  },
  {
    id: "w4",
    weekday: "Fri",
    date: "9",
    member: "[Member name]",
    status: "Scheduled",
    tone: "success" as Tone,
    amount: "₦75,000",
  },
];

export const payments = [
  {
    id: "p1",
    time: "10:42",
    member: "[Member name]",
    group: "[Market traders thrift]",
    channel: "Transfer",
    status: "Matched",
    tone: "success" as Tone,
    amount: "₦5,000",
  },
  {
    id: "p2",
    time: "10:31",
    member: "[Member name]",
    group: "[Weekly ajo, cycle 4]",
    channel: "Transfer",
    status: "Matched + credit",
    tone: "info" as Tone,
    amount: "₦12,000",
  },
  {
    id: "p3",
    time: "10:15",
    member: "Unknown sender",
    group: "Organisation account",
    channel: "Transfer",
    status: "Unmatched",
    tone: "warning" as Tone,
    amount: "₦20,000",
  },
  {
    id: "p4",
    time: "09:58",
    member: "[Member name]",
    group: "[Weekly ajo, cycle 4]",
    channel: "Cash, [Officer 2]",
    status: "Matched",
    tone: "success" as Tone,
    amount: "₦10,000",
  },
  {
    id: "p5",
    time: "09:40",
    member: "[Member name]",
    group: "[Market traders thrift]",
    channel: "Transfer",
    status: "Matched",
    tone: "success" as Tone,
    amount: "₦3,500",
  },
];

export const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  info: "bg-sky-50 text-sky-800",
  neutral: "bg-slate-100 text-slate-700",
};
