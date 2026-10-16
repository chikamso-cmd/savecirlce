import { useSyncExternalStore } from "react";
import type { KybStatus, OrgType, Provider } from "../types/types";

// The signed-in user's organisation. Onboarding only collects name and type;
// KYB documents are added from the profile page and payment rails from Settings.
// TODO: load from GET /organisation instead of localStorage

export interface UploadedDoc {
  name: string;
  size: number;
}

export interface KybRecord {
  status: KybStatus;
  reference: string;
  submittedAt: string;
  // Files can't live in localStorage, so only their names and sizes are kept
  documents: Record<string, UploadedDoc>;
}

export type RailsRecord =
  | { mode: "gateway"; provider: Provider; connectedAt: string }
  | { mode: "bank"; ticket: string; connectedAt: string }
  | { mode: "ledger"; connectedAt: string };

export interface Organisation {
  id: string;
  name: string;
  type: OrgType;
  createdAt: string;
  kyb: KybRecord | null;
  rails: RailsRecord | null;
}

const STORAGE_KEY = "savecircle.organisation";

function load(): Organisation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Organisation;
  } catch {
    // Storage unavailable or corrupt: treat as not onboarded
  }
  return null;
}

// Module-level store shared by every useOrganisation() caller, like GroupStore
let organisation: Organisation | null = load();
const listeners = new Set<() => void>();

function setOrganisation(next: Organisation | null) {
  organisation = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
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

export function getOrganisation() {
  return organisation;
}

function saveOrganisation(org: Omit<Organisation, "createdAt" | "kyb" | "rails">) {
  setOrganisation({
    createdAt: new Date().toISOString(),
    kyb: null,
    rails: null,
    ...organisation,
    ...org,
  });
}

function updateOrganisation(patch: Partial<Omit<Organisation, "id">>) {
  if (!organisation) return;
  setOrganisation({ ...organisation, ...patch });
}

export function useOrganisation() {
  const current = useSyncExternalStore(subscribe, () => organisation);
  return {
    organisation: current,
    saveOrganisation,
    updateOrganisation,
  };
}
