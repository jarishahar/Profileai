import { NextRequest, NextResponse } from "next/server";
import { decryptValue } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();



    if (typeof password !== "string" || !password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    const encrypted = process.env.PROFILE_PASSWORD_ENCRYPTED;
    if (!encrypted) {
      console.error("PROFILE_PASSWORD_ENCRYPTED env var not set");
      return NextResponse.json(
        { success: false, error: "Password not configured" },
        { status: 500 }
      );
    }

    const expectedPassword = decryptValue(encrypted);

    const isValid = password === expectedPassword;

    return NextResponse.json({ success: isValid });
  } catch (error) {
    console.error("Error verifying profile password:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
