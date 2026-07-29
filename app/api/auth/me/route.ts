import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  const authenticated = await getAuthenticatedUser(request as any);
  if (!authenticated) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: authenticated });
}
