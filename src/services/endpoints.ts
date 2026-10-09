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
  registrations: "vendors/registrations",
} as const;

export const LOCATION_ENDPOINTS = {
  list: "locations",
} as const;

export const ORDER_ENDPOINTS = {
  list: "orders",
  details: "orders/orderDetails",
} as const;

export const PROMO_CODE_ENDPOINTS = {
  list: "promocode/promocode",
  create: "promocode/create",
  details: "promocode",
  update: "promocode/update",
  delete: "promocode/delete",
} as const;

export const BANNER_ENDPOINTS = {
  list: "banners",
  create: "banners",
  details: (id: string) => `banners/${id}`,
  update: (id: string) => `banners/${id}`,
  status: (id: string) => `banners/${id}/status`,
  delete: (id: string) => `banners/${id}`,
  dashboard: "banners/dashboard",
} as const;

