import type { PolicyDocument, PolicyStatus, PolicyVersion } from "@/lib/types";
import { getVendorPolicy } from "@/services/vendors";

export const POLICY_CHAR_LIMIT = 20000;

let policyState: PolicyDocument = {
  englishContent: "",
  arabicContent: "",
  status: "draft",
  updatedAt: "",
  updatedBy: "",
};

let policyVersionsState: PolicyVersion[] = [];

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatPolicyDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/** GET /admin/vendors/policy — English and Arabic HTML only. */
export async function fetchPolicy(): Promise<PolicyDocument> {
  const policy = await getVendorPolicy();
  return {
    id: policy._id,
    englishContent: policy.policy?.en ?? "",
    arabicContent: policy.policy?.ar ?? "",
  };
}

/** The policy endpoint does not return version history. */
export async function fetchPolicyVersions(): Promise<PolicyVersion[]> {
  return [];
}

/** Swap for a real API call when available. */
export async function savePolicyDraft(input: {
  englishContent: string;
  arabicContent: string;
}) {
  await delay(240);
  policyState = {
    ...policyState,
    englishContent: input.englishContent.trim(),
    arabicContent: input.arabicContent.trim(),
    status: "draft",
    updatedAt: new Date().toISOString(),
    updatedBy: "Khalid",
  };
  policyVersionsState = [
    {
      id: `pv-${Date.now()}`,
      updatedAt: policyState.updatedAt ?? new Date().toISOString(),
      updatedBy: policyState.updatedBy ?? "Admin",
      status: "draft" as const,
      englishPreview: policyState.englishContent.slice(0, 120),
      arabicPreview: policyState.arabicContent.slice(0, 120),
    },
    ...policyVersionsState,
  ].slice(0, 8);
  return { ...policyState };
}

/** Swap for a real API call when available. */
export async function publishPolicy(input: {
  englishContent: string;
  arabicContent: string;
}) {
  await delay(280);
  policyState = {
    ...policyState,
    englishContent: input.englishContent.trim(),
    arabicContent: input.arabicContent.trim(),
    status: "published",
    updatedAt: new Date().toISOString(),
    updatedBy: "Khalid",
  };
  policyVersionsState = [
    {
      id: `pv-${Date.now()}`,
      updatedAt: policyState.updatedAt ?? new Date().toISOString(),
      updatedBy: policyState.updatedBy ?? "Admin",
      status: "published" as const,
      englishPreview: policyState.englishContent.slice(0, 120),
      arabicPreview: policyState.arabicContent.slice(0, 120),
    },
    ...policyVersionsState,
  ].slice(0, 8);
  return { ...policyState };
}

export function policyStatusLabel(status: PolicyStatus) {
  return status === "published" ? "Published" : "Draft";
}
