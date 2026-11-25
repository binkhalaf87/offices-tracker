import { NextResponse } from "next/server";
import { listDueFollowups, listOffices } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const due = new URL(req.url).searchParams.get("due") === "1";
  return NextResponse.json({ offices: due ? listDueFollowups() : listOffices() });
}
