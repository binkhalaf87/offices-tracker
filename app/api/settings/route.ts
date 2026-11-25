import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";
import { MAX_DAILY_LIMIT } from "@/lib/constants";
import { jsonError, readJson } from "@/lib/http";
import { apiErrors } from "@/lib/messages";

export const dynamic = "force-dynamic";

const MAX_TEMPLATE = 1500;

export function GET() {
  return NextResponse.json({ settings: getSettings() });
}

export async function PUT(req: Request) {
  const body = await readJson<{ template?: unknown; dailyLimit?: unknown }>(req);
  const template = typeof body?.template === "string" ? body.template.trim() : "";
  if (!template || template.length > MAX_TEMPLATE) return jsonError(apiErrors.badTemplate, 400);
  const dailyLimit = Number(body?.dailyLimit);
  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > MAX_DAILY_LIMIT) {
    return jsonError(apiErrors.badLimit, 400);
  }
  saveSettings({ template, dailyLimit });
  return NextResponse.json({ settings: getSettings() });
}
