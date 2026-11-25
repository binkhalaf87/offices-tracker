import { NextResponse } from "next/server";
import { getOffice, refreshOfficeData } from "@/lib/db";
import { badRequest, jsonError, notFound, parseId } from "@/lib/http";
import { apiErrors } from "@/lib/messages";
import { fetchPlaceDetails, getApiKey, PlacesError } from "@/lib/places";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return badRequest();
  const office = getOffice(id);
  if (!office) return notFound();
  const apiKey = getApiKey();
  if (!apiKey) return jsonError(apiErrors.noApiKey, 500);

  try {
    const place = await fetchPlaceDetails(office.placeId, apiKey);
    if (!place) return jsonError(apiErrors.placeGone, 404);
    return NextResponse.json({ office: refreshOfficeData(id, place) });
  } catch (err) {
    if (err instanceof PlacesError) return jsonError(err.message, 502);
    if (err instanceof Error && err.message.includes("UNIQUE")) return jsonError(apiErrors.badRequest, 409);
    throw err;
  }
}
