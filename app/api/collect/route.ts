import { NextResponse } from "next/server";
import { upsertPlaces } from "@/lib/db";
import { findCity } from "@/lib/constants";
import { badRequest, jsonError, readJson } from "@/lib/http";
import { apiErrors } from "@/lib/messages";
import { dedupePlaces, getApiKey, searchPhrase, type PlaceData } from "@/lib/places";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_PHRASES = 10;

export async function POST(req: Request) {
  const apiKey = getApiKey();
  if (!apiKey) return jsonError(apiErrors.noApiKey, 500);

  const body = await readJson<{ city?: unknown; phrases?: unknown }>(req);
  const city = typeof body?.city === "string" ? findCity(body.city) : undefined;
  if (!city) return jsonError(apiErrors.badCity, 400);
  if (!Array.isArray(body?.phrases)) return badRequest();
  const phrases = [
    ...new Set(
      body.phrases
        .filter((p): p is string => typeof p === "string")
        .map((p) => p.trim().slice(0, 100))
        .filter(Boolean),
    ),
  ];
  if (!phrases.length) return badRequest();
  if (phrases.length > MAX_PHRASES) return jsonError(apiErrors.tooManyPhrases, 400);

  const all: PlaceData[] = [];
  const errors: string[] = [];
  let requests = 0;
  // تسلسلياً عمداً: لا نضغط على حصة الواجهة
  for (const phrase of phrases) {
    const r = await searchPhrase(phrase, city, apiKey);
    requests += r.requests;
    all.push(...r.places);
    if (r.error) errors.push(`«${phrase}»: ${r.error}`);
  }

  const { unique, skippedClosed } = dedupePlaces(all);
  const { created, updated } = upsertPlaces(unique, city.name);

  return NextResponse.json({
    requests,
    fetched: all.length,
    unique: unique.length,
    created,
    updated,
    skippedClosed,
    errors,
  });
}
