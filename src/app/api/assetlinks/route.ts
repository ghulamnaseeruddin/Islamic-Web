import { NextResponse } from "next/server";

// Proves that the Android app (signed with our key) belongs to this website, so the
// app opens full screen without a browser address bar. Served at /.well-known/assetlinks.json
// (see the rewrite in next.config.mjs). The fingerprint comes from the app's signing key.
// If you ever upload the app to Google Play, add Google's "App signing" fingerprint here too.
const FINGERPRINTS = [
  "4A:88:F6:C7:09:29:32:04:59:2F:88:2A:D4:A5:F0:B3:07:E1:92:0A:7B:17:6D:CE:5B:0D:FC:3C:92:13:1B:F9",
];

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "app.vercel.islamic_web_liard.twa",
          sha256_cert_fingerprints: FINGERPRINTS,
        },
      },
    ],
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}