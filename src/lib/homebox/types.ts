// Ausschnitt der Homebox v0.27 API (siehe /swagger/doc.json der Instanz).

export type HbTag = { id: string; name: string; color?: string };

export type HbField = {
  id?: string;
  name: string;
  type: string; // "text" | "number" | "boolean" | "time"
  textValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  timeValue?: string;
};

export type HbAttachment = {
  id: string;
  type: string; // "photo" | "manual" | "receipt" | "warranty" | "attachment"
  title: string;
  mimeType?: string;
  primary?: boolean;
  thumbnail?: { id: string } | null;
};

export type HbEntityRef = { id: string; name: string } | null | undefined;

/** repo.EntityOut */
export type HbEntity = {
  id: string;
  name: string;
  assetId?: string;
  description?: string;
  notes?: string;
  quantity?: number;
  archived?: boolean;
  insured?: boolean;
  lifetimeWarranty?: boolean;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseFrom?: string;
  purchasePrice?: number;
  soldDate?: string;
  soldNotes?: string;
  soldPrice?: number;
  soldTo?: string;
  warrantyDetails?: string;
  warrantyExpires?: string;
  syncChildEntityLocations?: boolean;
  imageId?: string;
  thumbnailId?: string;
  entityType?: { id: string; name?: string; isLocation?: boolean } | null;
  parent?: HbEntityRef;
  location?: HbEntityRef;
  locationId?: string;
  tags?: HbTag[];
  fields?: HbField[];
  attachments?: HbAttachment[];
  updatedAt?: string;
  [key: string]: unknown;
};

/** repo.TreeItem */
export type HbTreeItem = {
  id: string;
  name: string;
  type: string;
  children?: HbTreeItem[];
};
