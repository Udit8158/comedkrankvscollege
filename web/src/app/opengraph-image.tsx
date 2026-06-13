import { ImageResponse } from "next/og";

export const alt = "COMEDK 2026 Rank vs College — College Predictor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0e1014",
          color: "#ece7da",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 6,
            color: "#e2b23b",
            textTransform: "uppercase",
          }}
        >
          COMEDK 2026
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 24,
          }}
        >
          From rank to college.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#8c8779",
            marginTop: 28,
            maxWidth: 920,
          }}
        >
          Enter your COMEDK rank — see the colleges and branches that fit.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#5b5850",
            marginTop: 44,
          }}
        >
          Based on the official COMEDK 2025 Round 3 cut-offs
        </div>
      </div>
    ),
    { ...size },
  );
}
