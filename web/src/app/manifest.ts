import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "COMEDK 2026 Rank vs College — MindCreed",
    short_name: "MindCreed COMEDK",
    description:
      "COMEDK 2026 rank-to-college predictor by MindCreed, based on the official COMEDK 2025 Round 3 cut-offs.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1014",
    theme_color: "#0e1014",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
