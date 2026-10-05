export const AUTH_ENDPOINTS = {
  adminLogin: "auth/login",
} as const;

export const OFFERING_ENDPOINTS = {
  list: "offerings",
  details: "offerings/details",
  categories: "offerings/categories",
  byVendor: "offerings/vendors",
  approvalList: "/offerings/approval-list",
  approve: "offerings/approve",
  reject: "offerings/reject",
  approveDelete: "offerings/approve-delete",
  rejectDelete: "offerings/reject-delete",
} as const;

export const VENDOR_ENDPOINTS = {
  list: "vendors",
  draft: "vendors/draft",
  sequence: "vendors/sequence",
  users: "vendors/users",
  details: "vendors/details",
  filters: "vendors/filters",
  reviews: "vendors/reviews",
  policy: "vendors/policy",
  /** Set this path when the vendor-registrations endpoint is available. */
  registrations: "" as string,
} as const;

export const LOCATION_ENDPOINTS = {
  list: "locations",
} as const;
