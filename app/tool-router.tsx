"use client";

import { useEffect } from "react";

type ToolId =
  | "png-jpg"
  | "jpg-png"
  | "webp-jpg"
  | "jpg-webp"
  | "image-pdf"
  | "pdf-image"
  | "compress"
  | "resize"
  | "merge"
  | "split";

const labels: Record<ToolId, string> = {
  "png-jpg": "PNG → JPG",
  "jpg-png": "JPG → PNG",
  "webp-jpg": "WEBP → JPG",
  "jpg-webp": "JPG → WEBP",
  "image-pdf": "Images → PDF",
  "pdf-image": "PDF → JPG / PNG",
  compress: "Image Compressor",
  resize: "Image Resizer",
  merge: "Merge PDF",
  split: "Split PDF",
};

const validTools = new Set(Object.keys(labels));

function selectRequestedTool() {
  const requested = new URLSearchParams(window.location.search).get("tool");
  if (!requested || !validTools.has(requested)) return false;

  const label = labels[requested as ToolId];
  const buttons = Array.from(document.querySelectorAll("button"));
  const button = buttons.find((item) => item.textContent?.replace(/\s+/g, " ").trim().includes(label));

  if (!button) return false;
  button.click();
  return true;
}

export default function ToolRouter() {
  useEffect(() => {
    if (selectRequestedTool()) return;

    const observer = new MutationObserver(() => {
      if (selectRequestedTool()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 5000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
