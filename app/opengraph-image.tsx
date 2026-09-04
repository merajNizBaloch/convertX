import { ImageResponse } from "next/og";

export const alt = "ConvertX — Free Online Image & PDF Converter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "#111315",
          color: "#f4f1e8",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, color: "#e0a14a", marginBottom: 20 }}>ConvertX</div>
        <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.05, letterSpacing: -3 }}>
          Free Online Image &amp; PDF Converter
        </div>
        <div style={{ fontSize: 30, color: "#a7a7a2", marginTop: 28 }}>
          PNG · JPG · WEBP · PDF — fast browser-based conversion
        </div>
      </div>
    ),
    { ...size }
  );
}
