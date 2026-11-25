import "server-only";
import { NextResponse } from "next/server";
import { apiErrors } from "./messages";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export const badRequest = () => jsonError(apiErrors.badRequest, 400);
export const notFound = () => jsonError(apiErrors.notFound, 404);
