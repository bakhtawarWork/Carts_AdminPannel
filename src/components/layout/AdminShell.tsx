"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { VENDOR_SECTION_META, ORDERS_SECTION_META, PROMO_CODES_SECTION_META, SEARCH_CATEGORIES_SECTION_META, CUSTOMERS_SECTION_META, USERS_SECTION_META, LOCATIONS_SECTION_META, COLLECTIONS_SECTION_META, POPULAR_SECTION_META, FILTER_TYPES_SECTION_META, BANNERS_SECTION_META } from "@/lib/nav";

function pageTitle(pathname: string) {
  if (pathname.includes("/analysis/popular-items") || pathname.startsWith("/popular/items")) {
    return "Most Popular Items";
  }
  if (pathname.includes("/analysis/popular-vendors") || pathname.startsWith("/popular/vendors")) {
    return "Most Popular Vendors";
  }
  if (
    pathname.includes("/analysis/popular-categories") ||
    pathname.startsWith("/popular/categories")
  ) {
    return "Most Popular Categories";
  }
  if (pathname === "/popular" || pathname.includes("/analysis/popular-collections")) {
    return "Popular Collections";
  }
  if (pathname === "/popular/collections/new") return "Add Collection";
  if (/^\/popular\/collections\/[^/]+\/edit$/.test(pathname)) {
    return "Edit Collection";
  }
  if (/^\/popular\/collections\/[^/]+\/sub\/new$/.test(pathname)) {
    return "Add Sub-collection";
  }
  if (/^\/popular\/collections\/[^/]+\/sub\/[^/]+\/edit$/.test(pathname)) {
    return "Edit Sub-collection";
  }
  if (/^\/popular\/collections\/[^/]+$/.test(pathname)) return "Collection";
  if (pathname.startsWith("/popular/collections")) return "Popular Collections";
  if (pathname === "/collections/new") return "Add Collection";
  if (/^\/collections\/[^/]+\/edit$/.test(pathname)) return "Edit Collection";
  if (/^\/collections\/[^/]+\/sub\/new$/.test(pathname)) {
    return "Add Sub-collection";
  }
  if (/^\/collections\/[^/]+\/sub\/[^/]+\/edit$/.test(pathname)) {
    return "Edit Sub-collection";
  }
  if (/^\/collections\/[^/]+$/.test(pathname)) return "Collection";
  if (pathname.includes("/analysis/vip-users")) return "VIP Users";
  if (pathname.startsWith("/dashboard")) return "Dashboard";

  if (pathname === "/vendors/new") return "Add Vendor";
  if (/^\/vendors\/[^/]+\/edit$/.test(pathname)) return "Edit Vendor";
  if (/^\/vendors\/[^/]+\/users$/.test(pathname)) return "Vendor Users";
  if (/^\/vendors\/[^/]+\/filters$/.test(pathname)) return "Filter Types";
  if (/^\/vendors\/[^/]+\/offerings$/.test(pathname)) return "Vendor Offerings";
  if (/^\/vendors\/[^/]+\/reviews$/.test(pathname)) return "Customer Review";
  if (pathname === "/promo-codes/new") return "Add Promo Code";
  if (/^\/promo-codes\/[^/]+\/edit$/.test(pathname)) return "Edit Promo Code";
  if (pathname === "/search-categories/new") return "Add Search Category Section";
  if (/^\/search-categories\/[^/]+\/edit$/.test(pathname)) {
    return "Edit Search Category Section";
  }
  if (/^\/vendors\/offering-approval\/[^/]+\/edit$/.test(pathname)) {
    return "Edit Offering";
  }
  if (/^\/vendors\/[^/]+\/offerings\/new$/.test(pathname)) return "Create Offering";
  if (/^\/vendors\/[^/]+\/offerings\/[^/]+\/edit$/.test(pathname)) {
    return "Edit Offering";
  }
  if (/^\/orders\/[^/]+$/.test(pathname)) return "Order Details";
  if (/^\/customers\/[^/]+$/.test(pathname)) return "Customer Details";
  if (/^\/users\/[^/]+\/edit$/.test(pathname)) return "Edit User";
  if (/^\/users\/[^/]+$/.test(pathname)) return "User Details";
  if (pathname === "/filter-types/new") return "Add Filter Type";
  if (/^\/filter-types\/[^/]+\/edit$/.test(pathname)) return "Edit Filter Type";
  if (pathname === "/banners/new") return "Add Banner";
  if (/^\/banners\/[^/]+(\/edit)?$/.test(pathname)) return "Edit Banner";

  const ordersMeta = ORDERS_SECTION_META[pathname];
  if (ordersMeta) return ordersMeta.title;

  const promoCodesMeta = PROMO_CODES_SECTION_META[pathname];
  if (promoCodesMeta) return promoCodesMeta.title;

  const searchCategoriesMeta = SEARCH_CATEGORIES_SECTION_META[pathname];
  if (searchCategoriesMeta) return searchCategoriesMeta.title;

  const customersMeta = CUSTOMERS_SECTION_META[pathname];
  if (customersMeta) return customersMeta.title;

  const usersMeta = USERS_SECTION_META[pathname];
  if (usersMeta) return usersMeta.title;

  const locationsMeta = LOCATIONS_SECTION_META[pathname];
  if (locationsMeta) return locationsMeta.title;

  const collectionsMeta = COLLECTIONS_SECTION_META[pathname];
  if (collectionsMeta) return collectionsMeta.title;

  const popularMeta = POPULAR_SECTION_META[pathname];
  if (popularMeta) return popularMeta.title;

  const filterTypesMeta = FILTER_TYPES_SECTION_META[pathname];
  if (filterTypesMeta) return filterTypesMeta.title;

  const bannersMeta = BANNERS_SECTION_META[pathname];
  if (bannersMeta) return bannersMeta.title;

  const vendorMeta = VENDOR_SECTION_META[pathname];
  if (vendorMeta) return vendorMeta.title;

  if (pathname.startsWith("/orders")) return "Orders";
  if (pathname.startsWith("/promo-codes")) return "Promo Codes";
  if (pathname.startsWith("/search-categories")) return "Search Categories";
  if (pathname.startsWith("/customers")) return "Customers";
  if (pathname.startsWith("/users")) return "Users";
  if (pathname.startsWith("/locations")) return "Locations";
  if (pathname.startsWith("/collections")) return "Collections";
  if (pathname.startsWith("/popular")) return "Popular";
  if (pathname.startsWith("/filter-types")) return "Filter Types";
  if (pathname.startsWith("/banners")) return "Banners";
  if (pathname.startsWith("/vendors")) return "Vendors";
  return "Admin";
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const isVendorForm =
    pathname === "/vendors/new" ||
    /^\/vendors\/[^/]+\/edit$/.test(pathname);
  const isOfferingForm =
    /^\/vendors\/offering-approval\/[^/]+\/edit$/.test(pathname) ||
    /^\/vendors\/[^/]+\/offerings\/(?:new|[^/]+\/edit)$/.test(pathname);
  const isVendorFiltersPage = /^\/vendors\/[^/]+\/filters$/.test(pathname);
  const isVendorOfferingsPage = /^\/vendors\/[^/]+\/offerings$/.test(pathname);
  const isSearchCategoryForm =
    pathname === "/search-categories/new" ||
    /^\/search-categories\/[^/]+\/edit$/.test(pathname);
  const isLocationsPage = pathname.startsWith("/locations");
  const isFullHeightForm =
    isVendorForm ||
    isOfferingForm ||
    isVendorFiltersPage ||
    isVendorOfferingsPage ||
    isSearchCategoryForm ||
    isLocationsPage;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          title={pageTitle(pathname)}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main
          className={
            isFullHeightForm
              ? isSearchCategoryForm
                ? "flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3"
                : isLocationsPage
                  ? "flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6"
                  : "flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4"
              : "min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
