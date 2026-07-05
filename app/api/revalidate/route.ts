import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * Next.js on-demand revalidation endpoint.
 * Allows administrators or backend events to immediately trigger cache invalidation
 * for public pages (e.g. after updating clinic settings or services).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, paths } = body;

    // Verify secret to authorize revalidation requests
    // Can be configured via environment variable REVALIDATION_SECRET
    const masterSecret = process.env.REVALIDATION_SECRET || "sanjivani-reval-secret-1029";
    if (secret !== masterSecret) {
      return NextResponse.json({ message: "Invalid secret token" }, { status: 401 });
    }

    if (!paths || !Array.isArray(paths)) {
      return NextResponse.json(
        { message: "Invalid payload: paths array is required" },
        { status: 400 }
      );
    }

    const revalidated: string[] = [];
    for (const path of paths) {
      if (typeof path === "string") {
        revalidatePath(path);
        revalidated.push(path);
      }
    }

    return NextResponse.json({
      revalidated: true,
      paths: revalidated,
      now: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
