import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Gagal keluar akun (POST):", err);
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`, {
    status: 303,
  });
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Gagal keluar akun (GET):", err);
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`, {
    status: 303,
  });
}
