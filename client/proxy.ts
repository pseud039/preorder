import { NextResponse, NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const reqUrl = new URL(request.url);

  // These routes would redirect to /dashboard if the user is authenticated
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/get-started",
    "/account-deletion",
    "/terms-and-conditions",
    "/refund-policy",
    "/privacy-policy",
  ];
  const publicRegex = [/\/verify-email\/[0-9a-fA-Z]*/, /\/reset-password\/[0-9a-fA-Z]*/];

  const isFile = reqUrl.pathname.includes(".");

  if (isFile) return NextResponse.next();

  if (reqUrl.pathname.startsWith("/_next/image")) return NextResponse.next();

  if (
    publicRoutes.includes(reqUrl.pathname) ||
    publicRegex.some((rx) => reqUrl.pathname.match(rx))
  ) {
    // if (request.cookies.get("accessToken"))
    // return NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
    if (!request.cookies.get("accessToken"))
      return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/(.*)",
};
