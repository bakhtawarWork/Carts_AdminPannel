export type CollectionSection = "popular" | "collections";

export function collectionRoutes(section: CollectionSection = "popular") {
  const resourceBase =
    section === "popular" ? "/popular/collections" : "/collections";
  const listHref = section === "popular" ? "/popular" : "/collections";

  return {
    section,
    sectionLabel: section === "popular" ? "Popular" : "Collections",
    title: section === "popular" ? "Popular Collections" : "Collections",
    listHref,
    newHref: `${resourceBase}/new`,
    detail: (id: string) => `${resourceBase}/${id}`,
    edit: (id: string) => `${resourceBase}/${id}/edit`,
    subNew: (id: string) => `${resourceBase}/${id}/sub/new`,
    subEdit: (id: string, subId: string) =>
      `${resourceBase}/${id}/sub/${subId}/edit`,
  };
}
