import withSerwistInit from "@serwist/next";

const isDev = process.env.NODE_ENV === "development";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  disable: isDev,
  additionalPrecacheEntries: [{ url: "/offline", revision: "1" }],
});

export default withSerwist({ typescript: { ignoreBuildErrors: true } });
