export const AUTH_ENDPOINTS = {
  adminLogin: "auth/login",
} as const;

export const OFFERING_ENDPOINTS = {
  list: "offerings",
  details: "offerings/details",
  categories: "offerings/categories",
  updateCategory: (id: string) =>
    `offering/category/updateOffering/${encodeURIComponent(id)}`,
  deleteCategory: (id: string) =>
    `offering/category/deleteOffering/${encodeURIComponent(id)}`,
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
  policyUpdate: "policies/update",
  registrations: "vendors/registrations",
} as const;

export const LOCATION_ENDPOINTS = {
  list: "locations",
  createLocation: "locations/createlocation",
  createSubarea: (locationId: string) => `locations/${locationId}/subareas`,
} as const;

export const ORDER_ENDPOINTS = {
  list: "orders",
  details: "orders/orderDetails",
  cancel: (id: string | number) => `orders/${id}/cancel`,
  reviewCancellation: (id: string | number) =>
    `orders/${encodeURIComponent(String(id))}/cancelations/review`,
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

export const COLLECTION_ENDPOINTS = {
  list: "collections",
  create: "collections",
  update: (id: string) => `collections/${id}`,
  delete: (id: string) => `collections/${id}`,
  addItem: (id: string) => `collections/${id}`,
  getItem: (id: string) => `collections/get-item/${id}`,
  updateItem: (id: string) => `collections/set-item/${id}`,
  deleteItem: (id: string) => `collections/item/${id}`,
  sortedOfferings: "collections/sorted-offerings",
  searchOfferings: (key: string) =>
    `collections/search-offerings/${encodeURIComponent(key)}`,
} as const;

export const SEARCH_CATEGORY_ENDPOINTS = {
  list: "search-categories",
  create: "search-categories",
  details: (id: string) => `search-categories/${id}`,
  update: (id: string) => `search-categories/${id}`,
  delete: (id: string) => `search-categories/${id}`,
} as const;

export const POLICY_ENDPOINTS = {
  update: "policies/update",
} as const;

export const DASHBOARD_ENDPOINTS = {
  generalStats: "/admin/dashboardgeneralstats",
} as const;

export const ORDER_STATS_ENDPOINTS = {
  vendorServiceCount: "order-stats/stats/vendor-service-count",
  customerSignups: "order-stats/stats/customer-signups",
  topVendors: "order-stats/stats/top-vendors",
} as const;

export const CUSTOMER_ENDPOINTS = {
  list: "customers",
  orderDetails: (id: string) =>
    `customers/${encodeURIComponent(id)}/order-details`,
  orders: (id: string) => `customers/${encodeURIComponent(id)}/orders`,
} as const;

export const POPULAR_COLLECTION_ENDPOINTS = {
  list: "popular-collections",
  create: "popular-collections",
  details: (id: string) => `popular-collections/${id}`,
  update: (id: string) => `popular-collections/${id}`,
  delete: (id: string) => `popular-collections/${id}`,
  subcollections: (id: string) => `popular-collections/${id}/subcollection`,
  createSubcollection: (id: string) => `popular-collections/${id}/subcollection`,
  subcollectionData: (id: string, subId: string) =>
    `popular-collections/${id}/subcollection/${subId}`,
  subcollectionDetails: (id: string, subId: string) =>
    `popular-collections/${id}/subcollection/details/${subId}`,
  updateSubcollection: (id: string, subId: string) =>
    `popular-collections/${id}/subcollection/${subId}`,
  deleteSubcollection: (id: string, subId: string) =>
    `popular-collections/${id}/subcollection/${subId}`,
  subcollectionItems: (id: string, subId: string, type: string) =>
    `popular-collections/${id}/subcollection/${subId}/items/${type}`,
  addSubcollectionItems: (id: string, subId: string) =>
    `popular-collections/${id}/subcollection/${subId}/items`,
  updateSubcollectionItem: (
    id: string,
    subId: string,
    type: string,
    itemId: string,
  ) => `popular-collections/${id}/subcollection/${subId}/items/${type}/${itemId}`,
  deleteSubcollectionItem: (
    id: string,
    subId: string,
    type: string,
    itemId: string,
  ) => `popular-collections/${id}/subcollection/${subId}/items/${type}/${itemId}`,
} as const;


