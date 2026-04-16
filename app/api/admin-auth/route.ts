import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminPassword,
  generateAdminToken,
  checkRateLimit,
} from "../../lib/admin";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  // Rate limiting
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later.", retryAfter: rateCheck.retryAfter },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password required." }, { status: 400 });
    }

    // Anti-brute-force: 2s delay on every attempt
    await new Promise((r) => setTimeout(r, 2000));

    if (!validateAdminPassword(password)) {
      return NextResponse.json({ error: "Access denied." }, { status: 401 });
    }

    const token = generateAdminToken();

    const response = NextResponse.json({
      success: true,
      message: "Access Granted. Welcome, Teja.",
    });

    // Set HTTP-only cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 2 * 60 * 60, // 2 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
