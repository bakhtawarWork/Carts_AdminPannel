export type NavIcon =
  | "dashboard"
  | "vendors"
  | "all-vendors"
  | "orders"
  | "promo-codes"
  | "categories"
  | "approval"
  | "registration"
  | "policies"
  | "customers"
  | "users"
  | "locations"
  | "collections"
  | "popular"
  | "filter-types"
  | "banners";

export type NavLink = {
  href: string;
  label: string;
  icon: NavIcon;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: NavIcon;
  children: NavLink[];
};

export type NavItem =
  | ({ type: "link" } & NavLink)
  | ({ type: "group" } & NavGroup);

export const APP_NAV: NavItem[] = [
  { type: "link", href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  {
    type: "group",
    id: "vendors",
    label: "Vendors",
    icon: "vendors",
    children: [
      { href: "/vendors", label: "All Vendors", icon: "all-vendors" },
      { href: "/vendors/orders", label: "Vendors Order", icon: "orders" },
      {
        href: "/vendors/offering-categories",
        label: "Offering Categories",
        icon: "categories",
      },
      {
        href: "/vendors/offering-approval",
        label: "Offering Approval",
        icon: "approval",
      },
      {
        href: "/vendors/registration",
        label: "Registration",
        icon: "registration",
      },
      { href: "/vendors/policies", label: "Policies", icon: "policies" },
    ],
  },
  {
    type: "link",
    href: "/orders",
    label: "Orders",
    icon: "orders",
  },
  {
    type: "link",
    href: "/promo-codes",
    label: "Promo Codes",
    icon: "promo-codes",
  },
  {
    type: "link",
    href: "/search-categories",
    label: "Search Categories",
    icon: "categories",
  },
  {
    type: "link",
    href: "/customers",
    label: "Customers",
    icon: "customers",
  },
  {
    type: "link",
    href: "/users",
    label: "Users",
    icon: "users",
  },
  {
    type: "link",
    href: "/locations",
    label: "Locations",
    icon: "locations",
  },
  {
    type: "link",
    href: "/collections",
    label: "Collections",
    icon: "collections",
  },
  {
    type: "link",
    href: "/popular",
    label: "Popular",
    icon: "popular",
  },
  {
    type: "link",
    href: "/filter-types",
    label: "Filter Types",
    icon: "filter-types",
  },
  {
    type: "link",
    href: "/banners",
    label: "Banner",
    icon: "banners",
  },
];

export const VENDOR_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/vendors": {
    title: "All Vendors",
    description: "Browse and manage every vendor on the platform.",
  },
  "/vendors/orders": {
    title: "Vendors Order",
    description: "Track and review orders placed with vendors.",
  },
  "/vendors/offering-categories": {
    title: "Offering Categories",
    description: "Organize vendor offerings by category.",
  },
  "/vendors/offering-approval": {
    title: "Offering Approval",
    description: "Review and approve vendor offerings.",
  },
  "/vendors/registration": {
    title: "Registration",
    description: "Manage vendor registration requests and onboarding.",
  },
  "/vendors/policies": {
    title: "Policies",
    description: "Configure vendor policies and compliance rules.",
  },
};

export const ORDERS_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/orders": {
    title: "All Orders",
    description: "Browse and manage every order on the platform.",
  },
};

export const PROMO_CODES_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/promo-codes": {
    title: "All Promo Codes",
    description: "Browse and manage promotional codes on the platform.",
  },
};

export const SEARCH_CATEGORIES_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/search-categories": {
    title: "Search Categories Sections",
    description: "Manage homepage search category groupings and visibility.",
  },
  "/search-categories/new": {
    title: "Add Search Category Section",
    description: "Create a new search category section with categories and vendors.",
  },
};

export const CUSTOMERS_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/customers": {
    title: "Customers",
    description: "Browse customers, order history, and spend totals.",
  },
};

export const USERS_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/users": {
    title: "Users",
    description: "Manage platform users, roles, and account status.",
  },
};

export const LOCATIONS_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/locations": {
    title: "Locations",
    description: "View and edit delivery subarea polygons on the map.",
  },
};

export const COLLECTIONS_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/collections": {
    title: "Collections",
    description: "Create collections and nested sub-collections.",
  },
  "/collections/new": {
    title: "Add Collection",
    description: "Create a published collection with bilingual names and an image.",
  },
};

export const POPULAR_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/popular": {
    title: "Popular Collections",
    description: "Create collections and nested sub-collections.",
  },
  "/popular/items": {
    title: "Most Popular Items",
    description: "Top selling offerings across the platform.",
  },
  "/popular/vendors": {
    title: "Most Popular Vendors",
    description: "Vendors ranked by order volume.",
  },
  "/popular/categories": {
    title: "Most Popular Categories",
    description: "Category performance and rankings.",
  },
  "/popular/collections": {
    title: "Popular Collections",
    description: "Create collections and nested sub-collections.",
  },
  "/popular/collections/new": {
    title: "Add Collection",
    description: "Create a published collection with bilingual names and an image.",
  },
};

export const FILTER_TYPES_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/filter-types": {
    title: "Filter Types",
    description: "Manage global filter categories and sub-types.",
  },
  "/filter-types/new": {
    title: "Add Filter Type",
    description: "Create a new filter category with sub-types.",
  },
};

export const BANNERS_SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  "/banners": {
    title: "Banners",
    description: "Manage main and sub banners shown on the landing page.",
  },
  "/banners/new": {
    title: "Add Banner",
    description: "Create a main or sub banner with image and sequence.",
  },
};

export function isNavLinkActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/vendors") return pathname === "/vendors";
  if (href === "/orders") return pathname.startsWith("/orders");
  if (href === "/promo-codes") return pathname.startsWith("/promo-codes");
  if (href === "/search-categories") return pathname.startsWith("/search-categories");
  if (href === "/customers") return pathname.startsWith("/customers");
  if (href === "/users") return pathname.startsWith("/users");
  if (href === "/locations") return pathname.startsWith("/locations");
  if (href === "/collections") return pathname.startsWith("/collections");
  if (href === "/popular") return pathname.startsWith("/popular");
  if (href === "/filter-types") return pathname.startsWith("/filter-types");
  if (href === "/banners") return pathname.startsWith("/banners");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavGroupActive(pathname: string, children: NavLink[]) {
  return children.some((child) => isNavLinkActive(pathname, child.href));
}
