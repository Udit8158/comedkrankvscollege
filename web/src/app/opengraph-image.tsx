import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/mindcreed";

export const alt =
  "COMEDK 2026 Rank vs College — College Predictor by MindCreed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share card. This is the brand's first impression in a WhatsApp forward — the
 * way most of this tool's traffic will actually arrive — so the wordmark sits
 * at the top where it survives the small preview crop, and the promise stays at
 * a size that still reads as a thumbnail.
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0e1014",
          color: "#ece7da",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 10,
              color: "#ece7da",
              textTransform: "uppercase",
            }}
          >
            {BRAND.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 6,
              color: "#e2b23b",
              textTransform: "uppercase",
            }}
          >
            COMEDK 2026
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1.05,
            }}
          >
            From rank to college.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#8c8779",
              marginTop: 26,
              maxWidth: 920,
            }}
          >
            Enter your COMEDK rank — see the colleges and branches that fit.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 21,
            color: "#5b5850",
            borderTop: "1px solid #262932",
            paddingTop: 26,
          }}
        >
          <div style={{ display: "flex" }}>
            Official COMEDK 2025 Round 3 cut-offs
          </div>
          <div style={{ display: "flex" }}>
            Admission counselling · Bengaluru
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
