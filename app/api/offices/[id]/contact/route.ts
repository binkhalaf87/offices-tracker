import { NextResponse } from "next/server";
import { getOffice, getSettings, recordContact } from "@/lib/db";
import { badRequest, jsonError, notFound, parseId } from "@/lib/http";
import { blockReasonText } from "@/lib/messages";
import { buildWhatsAppUrl, renderTemplate } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * يسجّل فتح محادثة واحدة ويعيد رابط wa.me. لا يرسل أي رسالة —
 * الإرسال يتم يدوياً من واتساب.
 */
export function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return badRequest();
  if (!getOffice(id)) return notFound();

  const result = recordContact(id);
  if (!result.ok) {
    if (!result.check) return notFound();
    return jsonError(blockReasonText(result.check.block), 409);
  }

  const message = renderTemplate(getSettings().template, { officeName: result.office.name, city: result.office.city });
  return NextResponse.json({
    url: buildWhatsAppUrl(result.number, message),
    office: result.office,
    counter: result.counter,
  });
}
