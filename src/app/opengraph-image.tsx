import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share preview (WhatsApp/Telegram/Facebook/X) — the site had none before, so a shared link showed no image at all. */
export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        backgroundColor: "#0e1622",
        backgroundImage: "linear-gradient(135deg, #0e1622 0%, #0e1622 60%, #1a2740 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "88px",
          height: "8px",
          backgroundColor: "#ffb300",
          marginBottom: "40px",
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 84,
          fontWeight: 700,
          color: "#f3f5f8",
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
        }}
      >
        AIMAG ELECTRIC
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "28px",
          fontSize: 34,
          color: "#9caebf",
          maxWidth: "920px",
          lineHeight: 1.4,
        }}
      >
        {siteConfig.description}
      </div>
    </div>,
    { ...size }
  );
}
