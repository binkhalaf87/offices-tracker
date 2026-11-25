import { NextResponse } from "next/server";
import { updateOffice, type OfficePatch } from "@/lib/db";
import { isOfficeStatus } from "@/lib/constants";
import { badRequest, notFound, parseId, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

const MAX_NOTES = 2000;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return badRequest();
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const patch: OfficePatch = {};
  if ("status" in body) {
    if (!isOfficeStatus(body.status)) return badRequest();
    patch.status = body.status;
  }
  if ("notes" in body) {
    if (typeof body.notes !== "string" || body.notes.length > MAX_NOTES) return badRequest();
    patch.notes = body.notes;
  }
  if ("nextFollowupAt" in body) {
    const v = body.nextFollowupAt;
    if (v === null) patch.nextFollowupAt = null;
    else if (typeof v === "string" && !Number.isNaN(new Date(v).getTime())) patch.nextFollowupAt = new Date(v).toISOString();
    else return badRequest();
  }

  const office = updateOffice(id, patch);
  if (!office) return notFound();
  return NextResponse.json({ office });
}
