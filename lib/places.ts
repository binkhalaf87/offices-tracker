import "server-only";
import { LOCATION_BIAS_RADIUS_M, MAX_PAGES_PER_PHRASE, RESULTS_PER_PAGE, type City } from "./constants";
import { apiErrors } from "./messages";

/**
 * عميل Google Places API (New). يعمل على الخادم فقط — المفتاح لا يغادر الخادم.
 * نطلب الحقول المطلوبة فقط لأن الفوترة تُحتسب حسب الحقول.
 */

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const DETAILS_URL = "https://places.googleapis.com/v1/places/";

const PLACE_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "rating",
  "userRatingCount",
  "googleMapsUri",
  "websiteUri",
  "businessStatus",
];

export const SEARCH_FIELD_MASK = [...PLACE_FIELDS.map((f) => `places.${f}`), "nextPageToken"].join(",");
export const DETAILS_FIELD_MASK = PLACE_FIELDS.join(",");

export type PlaceData = {
  placeId: string;
  name: string;
  address: string | null;
  nationalPhone: string | null;
  internationalPhone: string | null;
  rating: number | null;
  ratingCount: number | null;
  mapsUri: string | null;
  websiteUri: string | null;
  businessStatus: string | null;
};

type ApiPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  businessStatus?: string;
};

export class PlacesError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
  ) {
    super(message);
  }
}

export function getApiKey(): string | null {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  return key ? key : null;
}

function toPlaceData(p: ApiPlace): PlaceData | null {
  if (!p.id || !p.displayName?.text) return null;
  return {
    placeId: p.id,
    name: p.displayName.text,
    address: p.formattedAddress ?? null,
    nationalPhone: p.nationalPhoneNumber ?? null,
    internationalPhone: p.internationalPhoneNumber ?? null,
    rating: typeof p.rating === "number" ? p.rating : null,
    ratingCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
    mapsUri: p.googleMapsUri ?? null,
    websiteUri: p.websiteUri ?? null,
    businessStatus: p.businessStatus ?? null,
  };
}

async function googleFetch(url: string, init: RequestInit, fieldMask: string, apiKey: string): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!res.ok) {
    // لا نعيد أي جزء من المفتاح، فقط رسالة Google
    throw new PlacesError(apiErrors.googleError(res.status, body.error?.message ?? res.statusText), res.status);
  }
  return body;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type SearchPhraseResult = { places: PlaceData[]; requests: number; error?: string };

/** يبحث بعبارة واحدة ويمرّ على كل الصفحات (حتى 3 صفحات = 60 نتيجة). */
export async function searchPhrase(phrase: string, city: City, apiKey: string): Promise<SearchPhraseResult> {
  const places: PlaceData[] = [];
  let requests = 0;
  let pageToken: string | undefined;

  const baseBody = {
    textQuery: `${phrase} في ${city.name}`,
    languageCode: "ar",
    regionCode: "SA",
    pageSize: RESULTS_PER_PAGE,
    locationBias: {
      circle: { center: { latitude: city.lat, longitude: city.lng }, radius: LOCATION_BIAS_RADIUS_M },
    },
  };

  try {
    for (let page = 0; page < MAX_PAGES_PER_PHRASE; page++) {
      const body = pageToken ? { ...baseBody, pageToken } : baseBody;
      let data: { places?: ApiPlace[]; nextPageToken?: string };
      try {
        requests++;
        data = (await googleFetch(SEARCH_URL, { method: "POST", body: JSON.stringify(body) }, SEARCH_FIELD_MASK, apiKey)) as typeof data;
      } catch (err) {
        // رمز الصفحة التالية قد يحتاج لحظة قبل أن يصبح صالحاً: محاولة واحدة إضافية
        if (!pageToken || !(err instanceof PlacesError) || err.httpStatus !== 400) throw err;
        await sleep(2000);
        requests++;
        data = (await googleFetch(SEARCH_URL, { method: "POST", body: JSON.stringify(body) }, SEARCH_FIELD_MASK, apiKey)) as typeof data;
      }
      for (const p of data.places ?? []) {
        const pd = toPlaceData(p);
        if (pd) places.push(pd);
      }
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }
  } catch (err) {
    return { places, requests, error: err instanceof Error ? err.message : String(err) };
  }
  return { places, requests };
}

export async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceData | null> {
  if (!/^[A-Za-z0-9_-]+$/.test(placeId)) throw new PlacesError(apiErrors.badRequest, 400);
  const url = `${DETAILS_URL}${encodeURIComponent(placeId)}?languageCode=ar&regionCode=SA`;
  try {
    const data = (await googleFetch(url, { method: "GET" }, DETAILS_FIELD_MASK, apiKey)) as ApiPlace;
    return toPlaceData(data);
  } catch (err) {
    if (err instanceof PlacesError && err.httpStatus === 404) return null;
    throw err;
  }
}

/** يدمج النتائج بـ place_id ويستبعد المغلق نهائياً. */
export function dedupePlaces(places: PlaceData[]): { unique: PlaceData[]; skippedClosed: number } {
  const map = new Map<string, PlaceData>();
  const closed = new Set<string>();
  for (const p of places) {
    if (p.businessStatus === "CLOSED_PERMANENTLY") {
      closed.add(p.placeId);
      continue;
    }
    map.set(p.placeId, p);
  }
  return { unique: [...map.values()], skippedClosed: closed.size };
}
