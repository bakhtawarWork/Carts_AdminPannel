export type AuthUser = {
  id?: string;
  email: string;
  name: string;
  role: string;
  token: string;
  adminPermissions?: string[];
};

export type StatTone = "brand" | "slate" | "emerald" | "amber" | "violet" | "sky";

export type StatIcon = "vendors" | "orders" | "income" | "customers";

/** Shape returned by the dashboard summary API (or static mock). */
export type DashboardStat = {
  id: string;
  label: string;
  value: number;
  format: "number" | "currency";
  currency?: string;
  icon: StatIcon;
  tone: StatTone;
};

export type AnalysisLink = {
  id: string;
  title: string;
  href: string;
  tone: StatTone;
  description?: string;
};

export type DashboardSummary = {
  stats: DashboardStat[];
  analysis: AnalysisLink[];
  periodLabel: string;
  charts: DashboardCharts;
};

export type DashboardTrendPoint = {
  month: string;
  orders: number;
  income: number;
  signups: number;
};

export type DashboardCategoryShare = {
  name: string;
  value: number;
};

export type DashboardVendorBar = {
  name: string;
  orders: number;
};

export type DashboardCharts = {
  trends: DashboardTrendPoint[];
  categoryShare: DashboardCategoryShare[];
  topVendors: DashboardVendorBar[];
};

export type PopularItem = {
  id: string;
  published: boolean;
  imageUrl: string;
  name: string;
  nameAr?: string;
  vendor: string;
  vendorAr?: string;
  orderCount: number;
};

export type PopularVendor = {
  id: string;
  published: boolean;
  imageUrl: string;
  name: string;
  nameAr?: string;
  orderCount: number;
};

export type PopularCategory = {
  id: string;
  name: string;
  nameAr?: string;
  createdAt: string;
  approveStatus: string | null;
  orderCount: number;
};

export type PopularCollection = {
  id: string;
  englishName: string;
  arabicName: string;
  published: boolean;
  popular: boolean;
  serviceCategoryId: string;
  imageUrl: string;
  subCollections: PopularSubCollection[];
};

export type PopularSubCollection = {
  id: string;
  collectionId: string;
  englishName: string;
  arabicName: string;
  published: boolean;
};

export type PopularCollectionFormData = {
  id?: string;
  englishName: string;
  arabicName: string;
  published: boolean;
  popular: boolean;
  serviceCategoryId: string;
  imageUrl: string;
};

export type PopularSubCollectionFormData = {
  id?: string;
  collectionId: string;
  englishName: string;
  arabicName: string;
  published: boolean;
};

export type PopularCollectionServiceOption = {
  id: string;
  englishName: string;
  arabicName: string;
};

export type VipUser = {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  currency?: string;
};

export type VipUsersQuery = {
  name?: string;
  phone?: string;
  page: number;
  pageSize: number;
};

export type VipUsersResponse = {
  items: VipUser[];
  total: number;
  page: number;
  pageSize: number;
};

export type CustomerRecord = {
  id: string;
  name: string;
  orderCount: number;
  totalSpent: number;
  currency: string;
  lastOrderedAt: string;
};

export type CustomersQuery = {
  name?: string;
  page: number;
  pageSize: number;
};

export type CustomersResponse = {
  items: CustomerRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type UserRole = "customer" | "vendor";

export type UserRecord = {
  id: string;
  name: string;
  mobile: string;
  smsVerified: boolean;
  blocked: boolean;
  email: string;
  joinedAt: string;
  role: UserRole;
};

export type UsersQuery = {
  search?: string;
  role?: "" | UserRole;
  joinedFrom?: string;
  joinedTo?: string;
  page: number;
  pageSize: number;
  sortDir?: "asc" | "desc";
};

export type UsersResponse = {
  items: UserRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type VendorListTab = "vendors" | "draft";

export type VendorRegistrationCategory = "setups" | "restaurant";

export type VendorRegistrationLicensed = "Yes" | "No";

export type VendorRegistrationContact = {
  name: string;
  email: string;
  phone: string;
};

export type VendorRegistrationRecord = {
  _id: string;
  businessName: string;
  category: VendorRegistrationCategory;
  licensed: VendorRegistrationLicensed;
  instagram: string;
  contact: VendorRegistrationContact;
  createdAt: string;
  updatedAt: string;
};

export type VendorRegistrationsQuery = {
  page: number;
  pageSize: number;
};

export type VendorRegistrationsResponse = {
  items: VendorRegistrationRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type VendorRecord = {
  id: string;
  published: boolean;
  isDraft: boolean;
  englishName: string;
  arabicName: string;
  createdAt: string;
  updatedAt: string;
};

export type VendorsQuery = {
  tab: VendorListTab;
  published?: "all" | "published" | "unpublished";
  name?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page: number;
  pageSize: number;
};

export type VendorsResponse = {
  items: VendorRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type VendorUserRecord = {
  id: string;
  vendorId: string;
  name: string;
  email: string;
  mobile: string;
  preferredLanguage: string;
  blocked: boolean;
  createdAt: string;
};

export type VendorUserFormData = {
  name: string;
  email: string;
  mobile: string;
  password: string;
  preferredLanguage?: string;
  gender?: string;
  isBlocked: boolean;
};

export type VendorUsersResponse = {
  vendor: VendorRecord;
  items: VendorUserRecord[];
  total: number;
};

export type BilingualLabel = {
  en: string;
  ar: string;
};

export type FilterSubType = {
  id: string;
  name: BilingualLabel;
};

export type FilterCategory = {
  id: string;
  name: BilingualLabel;
  subTypes: FilterSubType[];
};

export type FilterTypeFormData = {
  id?: string;
  nameEn: string;
  nameAr: string;
  subTypes: FilterTypeSubTypeFormRow[];
};

export type FilterTypeSubTypeFormRow = {
  id?: string;
  nameEn: string;
  nameAr: string;
};

export type VendorFiltersResponse = {
  vendor: VendorRecord;
  categories: FilterCategory[];
  selectedSubTypeIds: string[];
};

export type VendorReviewRecord = {
  id: string;
  vendorId: string;
  orderId: string;
  userName: string;
  reviewText: string;
  serviceScore: number | null;
  qualityScore: number | null;
  respectOfTimeScore: number | null;
  presentationScore: number | null;
  deliveryScore: number | null;
  createdAt: string;
};

export type VendorReviewsResponse = {
  vendor: {
    id: string;
    name: BilingualLabel;
  };
  reviews: VendorReviewRecord[];
};

export type OfferingApproveStatus = "approved" | "pending" | "rejected";

export type VendorOfferingCategory = {
  id: string;
  name: BilingualLabel;
};

export type VendorOfferingRecord = {
  id: string;
  vendorId: string;
  name: BilingualLabel;
  approveStatus: OfferingApproveStatus;
  published: boolean;
  category: VendorOfferingCategory | null;
  thumbUrl: string;
  thumbAlt: string;
  startingPrice: number;
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type VendorOfferingsResponse = {
  vendor: {
    id: string;
    name: BilingualLabel;
  };
  offerings: VendorOfferingRecord[];
};

export type VendorOrderItem = {
  id: string;
  englishName: string;
  arabicName: string;
};

export type VendorOrderResponse = {
  items: VendorOrderItem[];
};

export type OfferingCategoryRecord = {
  id: string;
  englishName: string;
  arabicName: string;
  approveStatus?: string | null;
};

export type OfferingCategoriesQuery = {
  page: number;
  pageSize: number;
};

export type OfferingCategoriesResponse = {
  items: OfferingCategoryRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type SearchCategorySectionRecord = {
  id: string;
  published: boolean;
  englishName: string;
  arabicName: string;
  categoryCount: number;
};

export type SearchCategoryItem = {
  id: string;
  englishName: string;
  arabicName: string;
  published: boolean;
  imageUrl: string;
  vendorIds: string[];
};

export type SearchCategorySectionFormData = {
  id?: string;
  englishName: string;
  arabicName: string;
  published: boolean;
  categories: SearchCategoryItem[];
};

export type SearchCategoryVendorOption = {
  id: string;
  englishName: string;
  arabicName: string;
};

export type SearchCategorySectionsQuery = {
  page: number;
  pageSize: number;
};

export type SearchCategorySectionsResponse = {
  items: SearchCategorySectionRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type OfferingApprovalTab = "new" | "delete";

export type OfferingApprovalRecord = {
  id: string;
  vendorId: string;
  requestType: OfferingApprovalTab;
  published: boolean;
  thumbUrl: string;
  thumbAlt: string;
  vendorEnglish: string;
  vendorArabic: string;
  englishName: string;
  arabicName: string;
  createdAt: string;
  updatedAt: string;
  categoryEnglish: string;
  categoryArabic: string;
};

export type OfferingApprovalsQuery = {
  tab: OfferingApprovalTab;
  page: number;
  pageSize: number;
};

export type OfferingApprovalsResponse = {
  items: OfferingApprovalRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type OfferingBilingualLine = {
  id: string;
  english: string;
  arabic: string;
};

export type OfferingOptionItem = OfferingBilingualLine & {
  price?: string;
  maxQty?: string;
};

export type OfferingGalleryImage = {
  id: string;
  url: string;
  originalUrl?: string;
  cdnUrl?: string;
  key?: string;
  filename?: string;
  alt: string;
  name?: string;
  type?: string;
  size?: number;
  isExisting?: boolean;
};

export type OfferingOptionSection = {
  id: string;
  titleEnglish: string;
  titleArabic: string;
  requiredNumbers?: string;
  options: OfferingOptionItem[];
};

export type OfferingFormData = {
  vendorId: string;
  offeringId: string | null;
  approvalId?: string;
  englishName: string;
  arabicName: string;
  englishShortDescription: string;
  arabicShortDescription: string;
  gallery: OfferingGalleryImage[];
  initialExistingImageKeys?: string[];
  deletedImageKeys?: string[];
  order?: number;
  approveStatus?: string;
  collectionIds?: string[];
  offeringType: string;
  categoryId: string;
  published: boolean;
  femaleService: boolean;
  minimumQty: string;
  maxQty: string;
  itemPriceQr: string;
  startingPriceQr: string;
  maxTimeHours: string;
  setupTimeHours: string;
  minimumNotice: string;
  serviceAvailability: string;
  serviceAvailabilityCode: string;
  englishCapacityNote: string;
  arabicCapacityNote: string;
  requirements: OfferingBilingualLine[];
  includedFood: OfferingBilingualLine[];
  drinks: OfferingBilingualLine[];
  presentation: OfferingBilingualLine[];
  decorations: OfferingBilingualLine[];
  furniture: OfferingBilingualLine[];
  equipment: OfferingBilingualLine[];
  notes: OfferingBilingualLine[];
  requiredOptions: OfferingOptionSection[];
  addOns: OfferingOptionSection[];
};

export type PolicyStatus = "draft" | "published";

export type PolicyDocument = {
  id?: string;
  englishContent: string;
  arabicContent: string;
  status?: PolicyStatus;
  updatedAt?: string;
  updatedBy?: string;
};

export type PolicyVersion = {
  id: string;
  updatedAt: string;
  updatedBy: string;
  status: PolicyStatus;
  englishPreview: string;
  arabicPreview: string;
};

export type OrderListTab = "active" | "completed";

export type OrderStatus =
  | "onhold"
  | "confirmed"
  | "preparing"
  | "delivered"
  | "cancelled"
  | "canceled";

export type PaymentMethod = "Cash" | "Card" | "Online" | string;

export type PaymentStatus = "successful" | "pending" | "failed" | string;

export type OrderRecord = {
  id: string;
  orderNumber: number;
  vendorId: string;
  vendorEnglish: string;
  vendorArabic: string;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus | string;
  statusUpdatedAt: string;
  isLate: boolean;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  currency: string;
  isCancelled: boolean;
  isCompleted: boolean;
};

export type OrderVendorOption = {
  id: string;
  label: string;
};

export type OrdersQuery = {
  tab: OrderListTab;
  orderId?: string;
  vendorId?: string;
  eventDate?: string;
  cancellationStatus?: "any" | "cancelled" | "not_cancelled";
  orderStatus?: string;
  updatedInLast4Days?: "any" | "yes" | "no";
  page: number;
  pageSize: number;
};

export type OrdersResponse = {
  items: OrderRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type OrderHistoryEntry = {
  id: string;
  date: string;
  status: OrderStatus | string;
  by: string;
};

export type OrderCancellationRequest = {
  id: string;
  initiator: string;
  initiatedDate: string;
  cancellationReason: string;
  decided: boolean | null;
  decidedBy: string | null;
  decidedDate: string | null;
  approved: boolean | null;
};

export type OrderCustomerAddress = {
  zoneEnglish: string;
  zoneArabic: string;
  areaEnglish: string;
  areaArabic: string;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  mobile: string;
  mapsUrl: string;
};

export type OrderCustomerInfo = {
  name: string;
  mobile: string;
  email: string;
  joinDate: string;
};

export type OrderVendorDetail = {
  englishName: string;
  arabicName: string;
  rating: number | null;
  reviewCount: number;
};

export type OrderDetail = OrderRecord & {
  subTotal: number;
  deliveryCharges: number;
  address: OrderCustomerAddress;
  customer: OrderCustomerInfo;
  vendor: OrderVendorDetail;
  history: OrderHistoryEntry[];
  cancellationRequests: OrderCancellationRequest[];
};

export type PromoCodeListTab = "admin" | "vendor";

export type PromoCodeRecord = {
  id: string;
  code: string;
  isActive: boolean;
  createdBy: PromoCodeListTab;
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit: number | null;
  vendorId: string;
  vendorEnglish: string;
  vendorArabic: string;
  promoCodeType: PromoCodeType;
  amountPercent: number;
  amountQr: number | null;
  cartsSharePercent: number;
  vendorsSharePercent: number;
  createdAt: string;
  updatedAt: string;
};

export type PromoCodesQuery = {
  tab: PromoCodeListTab;
  page: number;
  pageSize: number;
};

export type PromoCodesResponse = {
  items: PromoCodeRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type PromoCodeType = "percentage" | "fixed" | "free_delivery";

export type PromoCodeFormData = {
  id?: string;
  code: string;
  maxUsageLimit: string;
  startDate: string;
  endDate: string;
  promoCodeType: PromoCodeType | "";
  vendorId: string;
  vendorEnglish: string;
  vendorArabic: string;
  isLive: boolean;
  amountQr: string;
  cartsSharePercent: number;
};

export type VendorServiceId =
  | "catering"
  | "delivery"
  | "setups"
  | "hospitality"
  | "feasts";

export type VendorImageAsset = {
  id: string;
  url: string;
  title: string;
  alt: string;
  key?: string;
  file?: File;
  size?: number;
  isExisting?: boolean;
};

export type VendorDeliveryAreaEntry = {
  id: string;
  areaId: string;
  cost: string;
};

export type DeliveryAreaOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  zoneEn?: string;
  zoneAr?: string;
};

export type DeliveryAreaGroup = {
  id: string;
  nameEn: string;
  nameAr: string;
  subareas: DeliveryAreaOption[];
};

export type VendorServiceFields = {
  images: VendorImageAsset[];
  minNotice: string;
  capacity: string;
  deliveryAreas: VendorDeliveryAreaEntry[];
};

export type VendorFormData = {
  id?: string;
  englishName: string;
  englishTagline: string;
  englishShortDescription: string;
  arabicName: string;
  arabicTagline: string;
  arabicShortDescription: string;
  logo: VendorImageAsset | null;
  email: string;
  secondaryEmail?: string;
  accountingEmails?: string[];
  mobile: string;
  phone: string;
  published: boolean;
  doublePoints: boolean;
  percentage: string;
  order?: number;
  isFullyBooked?: boolean;
  minimumOrderAmountCatering?: string;
  minimumOrderAmountDelivery?: string;
  minimumOrderTimeInHours?: string;
  collectionIds?: string[];
  servicesOffered: VendorServiceId[];
  services: Record<VendorServiceId, VendorServiceFields>;
  initialLogoKey?: string;
  deletedLogoKeys?: string[];
  initialServiceImageKeys?: Partial<Record<VendorServiceId, string[]>>;
  deletedServiceImageKeys?: Partial<Record<VendorServiceId, string[]>>;
};

export type BannerType = "main" | "sub";

export type BannerRecord = {
  id: string;
  type: BannerType;
  name: string;
  nameAr?: string;
  imageUrl: string;
  sequence: number;
  isActive: boolean;
  redirectionPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type BannerFormData = {
  type: BannerType;
  name: string;
  nameAr?: string;
  imageUrl: string;
  sequence: string;
  isActive: boolean;
  redirectionPath: string;
  imageFileName?: string;
  imageFileType?: string;
};

