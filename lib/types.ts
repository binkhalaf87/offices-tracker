import type { OfficeStatus } from "./constants";

export type Office = {
  id: number;
  placeId: string;
  name: string;
  city: string;
  address: string | null;
  nationalPhone: string | null;
  internationalPhone: string | null;
  rating: number | null;
  ratingCount: number | null;
  mapsUri: string | null;
  websiteUri: string | null;
  businessStatus: string | null;
  status: OfficeStatus;
  notes: string;
  lastContactAt: string | null;
  nextFollowupAt: string | null;
  contactCount: number;
  dataUpdatedAt: string;
  createdAt: string;
};

export type Settings = {
  template: string;
  dailyLimit: number;
};

export type TodayCounter = {
  day: string;
  count: number;
  limit: number;
};
