"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileImage,
  ImagePlus,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Converter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [quality, setQuality] = useState(0.9);
  const [output, setOutput] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setFile(null);
    setPreview("");
    setOutput(null);
    setOutputUrl("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function acceptFile(selected: File) {
    setError("");
    if (!selected.type.includes("png") && !selected.name.toLowerCase().endsWith(".png")) {
      setError("Please select a PNG image.");
      return;
    }
    if (selected.size === 0) {
      setError("That file appears to be empty.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setOutput(null);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl("");
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) acceptFile(selected);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) acceptFile(selected);
  }

  async function convert() {
    if (!file) return;
    setError("");

    try {
      const img = new Image();
      img.src = preview;
      await img.decode();

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");

      // JPG does not support transparency. White is the least surprising default.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );

      if (!blob) throw new Error("The browser could not create the JPG.");
      const url = URL.createObjectURL(blob);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutput(blob);
      setOutputUrl(url);
    } catch {
      setError("Conversion failed. Please try another PNG image.");
    }
  }

  function download() {
    if (!outputUrl || !file) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `${file.name.replace(/\.png$/i, "")}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-[#111827]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-black text-white">
              <FileImage size={20} />
            </div>
            <span className="text-lg font-semibold tracking-tight">Convertly</span>
          </div>
          <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
            <Lock size={15} /> Private by design
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-20 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
          <Sparkles size={14} />
          Free PNG to JPG converter
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
          Convert PNG to JPG
          <span className="block text-gray-400">without uploading your image.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
          Your image is processed locally in your browser. No account, server upload,
          database, or file storage required.
        </p>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`mx-auto mt-12 max-w-3xl cursor-pointer rounded-3xl border-2 border-dashed p-10 transition sm:p-16 ${
              dragging
                ? "border-black bg-gray-100"
                : "border-gray-300 bg-white hover:border-gray-500 hover:bg-gray-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,.png"
              className="hidden"
              onChange={onPick}
            />
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gray-100">
              <Upload size={28} />
            </div>
            <h2 className="mt-6 text-xl font-semibold">Drop your PNG here</h2>
            <p className="mt-2 text-sm text-gray-500">or click to browse your device</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white">
              <ImagePlus size={17} /> Choose PNG
            </div>
            <p className="mt-5 text-xs text-gray-400">Processing happens locally in your browser</p>
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-black/10 bg-white p-5 text-left shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{file.name}</p>
                <p className="mt-1 text-sm text-gray-500">{formatBytes(file.size)}</p>
              </div>
              <button onClick={reset} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100" aria-label="Remove image">
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px]">
              <img src={preview} alt="PNG preview" className="mx-auto max-h-[460px] max-w-full object-contain" />
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="quality" className="font-medium">JPG quality</label>
                  <span className="font-semibold">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  id="quality"
                  type="range"
                  min="0.4"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="mt-3 w-full accent-black"
                />
                <p className="mt-2 text-xs text-gray-500">Higher quality usually means a larger JPG file.</p>
              </div>

              {!output ? (
                <button onClick={convert} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 font-medium text-white hover:bg-gray-800">
                  Convert to JPG <ArrowRight size={17} />
                </button>
              ) : (
                <button onClick={download} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 font-medium text-white hover:bg-gray-800">
                  <Download size={17} /> Download JPG
                </button>
              )}
            </div>

            {output && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-50 p-4 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={18} />
                  Conversion complete
                </div>
                <span className="text-gray-500">
                  JPG size: {formatBytes(output.size)}
                </span>
              </div>
            )}

            <button onClick={reset} className="mx-auto mt-5 flex items-center gap-2 text-sm text-gray-500 hover:text-black">
              <RotateCcw size={15} /> Convert another image
            </button>
          </div>
        )}

        {error && <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-red-600">{error}</p>}

        <div className="mx-auto mt-12 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
          {[
            [ShieldCheck, "Private", "Images stay on your device."],
            [Sparkles, "Free", "No account or subscription."],
            [Lock, "Secure", "Nothing is uploaded to a server."],
          ].map(([Icon, title, text]) => (
            <div key={title as string} className="rounded-2xl border border-black/5 bg-white p-4">
              <Icon size={19} />
              <p className="mt-3 text-sm font-semibold">{title as string}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">{text as string}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
