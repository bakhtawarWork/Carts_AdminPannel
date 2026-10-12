import type { PolicyDocument, PolicyStatus, PolicyVersion } from "@/lib/types";
import { getVendorPolicy, updateVendorPolicy } from "@/services/vendors";

export const POLICY_CHAR_LIMIT = 20000;

let policyState: PolicyDocument = {
  englishContent: "",
  arabicContent: "",
  status: "published",
  updatedAt: "",
  updatedBy: "",
};

let policyVersionsState: PolicyVersion[] = [];

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
  const doc: PolicyDocument = {
    id: typeof policy._id === "string" ? policy._id : undefined,
    englishContent: policy.policy?.en ?? "",
    arabicContent: policy.policy?.ar ?? "",
    status: "published",
  };
  policyState = { ...policyState, ...doc };
  return doc;
}

/** The policy endpoint does not return version history. */
export async function fetchPolicyVersions(): Promise<PolicyVersion[]> {
  return policyVersionsState;
}

/**
 * Update policy via API (PUT/POST /admin/policies/update).
 * Req: { policyPayload: { en: string, ar: string } }
 */
export async function updatePolicy(input: {
  englishContent: string;
  arabicContent: string;
}): Promise<PolicyDocument & { message?: string }> {
  const result = await updateVendorPolicy({
    policyPayload: {
      en: input.englishContent.trim(),
      ar: input.arabicContent.trim(),
    },
  });

  const updatedEnglish = result.policy?.en ?? input.englishContent.trim();
  const updatedArabic = result.policy?.ar ?? input.arabicContent.trim();
  const now = new Date().toISOString();

  policyState = {
    ...policyState,
    englishContent: updatedEnglish,
    arabicContent: updatedArabic,
    status: "published",
    updatedAt: now,
    updatedBy: "Admin",
  };

  policyVersionsState = [
    {
      id: `pv-${Date.now()}`,
      updatedAt: now,
      updatedBy: "Admin",
      status: "published" as const,
      englishPreview: updatedEnglish.slice(0, 120),
      arabicPreview: updatedArabic.slice(0, 120),
    },
    ...policyVersionsState,
  ].slice(0, 8);

  return {
    ...policyState,
    message: result.message,
  };
}

export async function savePolicyDraft(input: {
  englishContent: string;
  arabicContent: string;
}) {
  return updatePolicy(input);
}

export async function publishPolicy(input: {
  englishContent: string;
  arabicContent: string;
}) {
  return updatePolicy(input);
}

export function policyStatusLabel(status: PolicyStatus) {
  return status === "published" ? "Published" : "Draft";
}

