// export type OrgType = "mfb" | "bank" | "cooperative" | "business" | "informal";
export type OrgType = "cooperative" | "business" | "informal";
export type MoneyMode = "bank" | "gateway" | "ledger";
export type Provider = "paystack" | "flutterwave";
export type StepStatus = "done" | "current" | "review" | "upcoming";
export type KybStatus = "in_review" | "approved" | "action_needed";

// v4 §2.1: MFB/bank → bank-hosted, cooperative/business → gateway-hosted, informal → ledger-only
export const moneyModeFor = (type: OrgType): MoneyMode =>
  // type === "mfb" || type === "bank"
  //   ? "bank"
    type === "informal"
      ? "ledger"
      : "gateway";

export interface OrgDetails {
  name: string;
  type: OrgType | null;
}

export const ORG_TYPES: { value: OrgType; title: string; description: string }[] = [
  // {
  //   value: "mfb",
  //   title: "Microfinance bank",
  //   description: "Run daily or weekly contribution products for your customers.",
  // },
  // {
  //   value: "bank",
  //   title: "Bank",
  //   description: "Run thrift and ajo products at banking scale.",
  // },
  {
    value: "cooperative",
    title: "Cooperative society",
    description: "Member contributions, notice-based withdrawals and AGM records.",
  },
  {
    value: "business",
    title: "Registered business",
    description: "Run savings or contribution programmes for staff or customers.",
  },
  {
    value: "informal",
    title: "Informal group",
    description: "Ajo, esusu or church thrift. Free ledger-only tier.",
  },
];

export const MONEY_MODE_INFO: Record<
  MoneyMode,
  { title: string; description: string }
> = {
  bank: {
    title: "Bank-hosted",
    description:
      "Funds stay on your own books. Account numbers come from your core banking system.",
  },
  gateway: {
    title: "Gateway-hosted",
    description:
      "Funds sit in your own Paystack or Flutterwave balance and settle to your bank account.",
  },
  ledger: {
    title: "Ledger-only",
    description:
      "Money moves off-app. You log cash and transfers by hand. Free.",
  },
};

export interface DocSlot {
  id: string;
  title: string;
  hint: string;
  required: boolean;
}

// v4 §2.2: registration document depends on organisation type
export function documentsFor(type: OrgType): DocSlot[] {
  const registration: Record<OrgType, DocSlot[]> = {
    business: [
      {
        id: "cac",
        title: "Certificate of Incorporation",
        hint: "CAC-issued certificate",
        required: true,
      },
    ],
    cooperative: [
      {
        id: "coop_cert",
        title: "Cooperative registration certificate",
        hint: "Issued by your state cooperative department",
        required: true,
      },
    ],
    // mfb: [
    //   {
    //     id: "cbn_licence",
    //     title: "CBN licence",
    //     hint: "Your microfinance bank operating licence",
    //     required: true,
    //   },
    //   {
    //     id: "cac",
    //     title: "Certificate of Incorporation",
    //     hint: "CAC-issued certificate",
    //     required: true,
    //   },
    // ],
    // bank: [
    //   {
    //     id: "cbn_licence",
    //     title: "CBN licence",
    //     hint: "Your banking licence",
    //     required: true,
    //   },
    //   {
    //     id: "cac",
    //     title: "Certificate of Incorporation",
    //     hint: "CAC-issued certificate",
    //     required: true,
    //   },
    // ],
    informal: [],
  };

  const founding: DocSlot =
    type === "cooperative"
      ? {
          id: "bylaws",
          title: "Bye-laws",
          hint: "Your society's registered bye-laws",
          required: true,
        }
      : {
          id: "memart",
          title: "Memorandum & Articles of Association",
          hint: "Your founding documents",
          required: true,
        };

  if (type === "informal") {
    return [
      {
        id: "additional",
        title: "Supporting document (optional)",
        hint: "Any record of your group, e.g. a constitution",
        required: false,
      },
    ];
  }

  return [
    ...registration[type],
    founding,
    {
      id: "tin",
      title: "Tax Identification Number (TIN)",
      hint: "Your organisation’s TIN document",
      required: true,
    },
    // {
    //   id: "premises",
    //   title: "Business premises evidence",
    //   hint: "Utility bill or letter of address",
    //   required: true,
    // },
    {
      id: "additional",
      title: "Additional documents",
      hint: "Anything else relevant (optional)",
      required: false,
    },
  ];
}

// export interface Director {
//   id: string;
//   fullName: string;
//   bvn: string;
// }

// // export interface SettlementAccount {
// //   bankCode: string;
// //   accountNumber: string;
// //   accountName: string | null; // set after name enquiry
// }

export interface KybData {
  documents: Record<string, File | undefined>;
  // directors: Director[];
  // settlement: SettlementAccount;
}

export const emptyKyb = (): KybData => ({
  documents: {},
  // directors: [{ id: crypto.randomUUID(), fullName: "", bvn: "" }],
  // settlement: { bankCode: "", accountNumber: "", accountName: null },
});

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

// TODO: replace with the bank list from your PaymentProvider (e.g. GET /bank)
export const BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "011", name: "First Bank" },
  { code: "058", name: "GTBank" },
  { code: "033", name: "UBA" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
];

// Placeholder: point this at your real webhook ingress
export const WEBHOOK_BASE_URL = "https://api.savecircle.app/webhooks";
