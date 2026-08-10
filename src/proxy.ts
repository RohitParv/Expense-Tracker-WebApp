import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|apple-touch-icon.png|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|json)$).*)",
  ],
};
