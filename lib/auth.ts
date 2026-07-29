import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const COOKIE_NAME = "app_session";
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, derived] = stored.split(":");
  if (!salt || !derived) return false;
  const attempted = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(attempted, "hex"), Buffer.from(derived, "hex"));
}

export function signSession(userId: number) {
  const payload = `${userId}:${Date.now()}`;
  const signature = createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return `${payload}:${signature}`;
}

export function verifySession(token: string) {
  const [userId, timestamp, signature] = token.split(":");
  if (!userId || !timestamp || !signature) return null;
  const payload = `${userId}:${timestamp}`;
  const expected = createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"))) {
    return null;
  }
  return Number(userId);
}

export function setSessionCookie(response: NextResponse, userId: number) {
  const token = signSession(userId);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthenticatedUser(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return null;
  const userId = verifySession(cookie);
  if (!userId) return null;

  const { data, error } = await supabaseAdmin.from("users").select("id, email").eq("id", userId).single();
  if (error || !data) return null;
  return data;
}
