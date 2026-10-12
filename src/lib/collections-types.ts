export type CollectionOffering = {
  id: string;
  thumb: string;
  vendorName: string;
  vendorNameAr?: string;
  offeringName: string;
  offeringNameAr?: string;
  serviceType: string;
  orderCount: number;
  vendorId?: string;
  vendorID?: string;
};

export type CollectionItemSubCategory = {
  id: string;
  englishName: string;
  arabicName: string;
  offerings: CollectionOffering[];
};

export type CollectionItem = {
  id: string;
  collectionId: string;
  englishName: string;
  arabicName: string;
  englishImage: string;
  arabicImage: string;
  subCategories: CollectionItemSubCategory[];
  createdAt?: string;
};

export type Collection = {
  id: string;
  englishName: string;
  arabicName: string;
  published: boolean;
  items: CollectionItem[];
  createdAt?: string;
};

export type CollectionFormData = {
  id?: string;
  englishName: string;
  arabicName: string;
  published: boolean;
};

export type CollectionItemFormData = {
  id?: string;
  collectionId: string;
  englishName: string;
  arabicName: string;
  englishImage: string;
  arabicImage: string;
  subCategories: {
    id: string;
    englishName: string;
    arabicName: string;
    offerings: CollectionOffering[];
  }[];
};
