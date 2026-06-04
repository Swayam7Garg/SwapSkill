import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Detect if Clerk keys are configured
const clerkActive = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
                    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder" &&
                    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_dGVzdC1jbGVyay1zdGFydHVwLWFwcC0xMC5jbGVyay5hY2NvdW50cy5kZXYk";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/profile(.*)",
  "/requests(.*)",
  "/sessions(.*)",
  "/leaderboard(.*)",
]);

export default function middleware(req: any, event: any) {
  if (!clerkActive) {
    // Pass-through immediately for local sandbox development
    return NextResponse.next();
  }

  // Only call clerkMiddleware when active
  return clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
      const session = await auth();
      (session as any).protect();
    }
  })(req, event);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
