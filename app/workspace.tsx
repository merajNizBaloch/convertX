"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine, ArrowRight, Check, FileImage, FileText, Files, Image as ImageIcon,
  Layers, ShieldCheck, Upload, X, Zap, Settings2, Hammer,
  PackageOpen, Gauge, Maximize2, Minimize2, Combine, Split, RefreshCw
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

type ToolId = "png-jpg" | "jpg-png" | "webp-jpg" | "jpg-webp" | "image-pdf" | "pdf-image" | "compress" | "resize" | "merge" | "split";
type Tool = { id: ToolId; title: string; short: string; description: string; group: "Image" | "PDF"; from: string; to: string; icon: typeof FileImage; color: string; tint: string };
type Output = { name: string; blob: Blob; inputSize: number };

const tools: Tool[] = [
  { id: "png-jpg", title: "PNG → JPG", short: "PNG / JPG", description: "Convert transparent PNG artwork into clean, compact JPG files.", group: "Image", from: "PNG", to: "JPG", icon: FileImage, color: "#ff6b6b", tint: "rgba(255,107,107,.15)" },
  { id: "jpg-png", title: "JPG → PNG", short: "JPG / PNG", description: "Turn JPG images into lossless PNG assets for editing and design work.", group: "Image", from: "JPG", to: "PNG", icon: ImageIcon, color: "#38bdf8", tint: "rgba(56,189,248,.15)" },
  { id: "webp-jpg", title: "WEBP → JPG", short: "WEBP / JPG", description: "Convert WEBP images into widely compatible JPG files.", group: "Image", from: "WEBP", to: "JPG", icon: Layers, color: "#a78bfa", tint: "rgba(167,139,250,.15)" },
  { id: "jpg-webp", title: "JPG → WEBP", short: "JPG / WEBP", description: "Produce efficient WEBP images for websites and digital products.", group: "Image", from: "JPG", to: "WEBP", icon: Files, color: "#34d399", tint: "rgba(52,211,153,.15)" },
  { id: "compress", title: "Image Compressor", short: "Compress", description: "Reduce file weight while keeping control over visual quality.", group: "Image", from: "IMG", to: "MIN", icon: Gauge, color: "#fbbf24", tint: "rgba(251,191,36,.15)" },
  { id: "resize", title: "Image Resizer", short: "Resize", description: "Set exact output dimensions for social, web, print, or UI assets.", group: "Image", from: "IMG", to: "PX", icon: Maximize2, color: "#fb7185", tint: "rgba(251,113,133,.15)" },
  { id: "image-pdf", title: "Images → PDF", short: "Images / PDF", description: "Arrange one or more images into a single PDF document.", group: "PDF", from: "IMG", to: "PDF", icon: FileText, color: "#f97316", tint: "rgba(249,115,22,.15)" },
  { id: "pdf-image", title: "PDF → JPG / PNG", short: "PDF / Image", description: "Render every PDF page into high-resolution JPG or PNG images.", group: "PDF", from: "PDF", to: "IMG", icon: Minimize2, color: "#22d3ee", tint: "rgba(34,211,238,.15)" },
  { id: "merge", title: "Merge PDF", short: "Merge PDF", description: "Join multiple PDF documents into one ordered file.", group: "PDF", from: "PDF", to: "PDF", icon: Combine, color: "#c084fc", tint: "rgba(192,132,252,.15)" },
  { id: "split", title: "Split PDF", short: "Split PDF", description: "Extract a selected page from a PDF into a new document.", group: "PDF", from: "PDF", to: "PDF", icon: Split, color: "#4ade80", tint: "rgba(74,222,128,.15)" },
];

function bytes(n: number) { if (n < 1024) return `${n} B`; if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`; return `${(n / 1048576).toFixed(2)} MB`; }
function ext(name: string) { return name.split(".").pop()?.toUpperCase() || "FILE"; }
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer { const buffer = new ArrayBuffer(bytes.byteLength); new Uint8Array(buffer).set(bytes); return buffer; }

export default function Workspace() {
  const input = useRef<HTMLInputElement>(null);
  const [toolId, setToolId] = useState<ToolId>("png-jpg");
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("Ready for material");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(88);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [format, setFormat] = useState<"jpg" | "png">("jpg");
  const [splitPage, setSplitPage] = useState(1);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
  const MAX_PDF_SIZE = 40 * 1024 * 1024;
  const MAX_BATCH_SIZE = 80 * 1024 * 1024;
  const tool = tools.find(t => t.id === toolId)!;

  const totalInput = files.reduce((n, f) => n + f.size, 0);
  const totalOutput = outputs.reduce((n, f) => n + f.blob.size, 0);
  const reduction = totalInput && totalOutput ? Math.max(0, Math.round((1 - totalOutput / totalInput) * 100)) : 0;
  const grouped = useMemo(() => [
    { label: "IMAGE BENCH", items: tools.filter(t => t.group === "Image") },
    { label: "PDF BENCH", items: tools.filter(t => t.group === "PDF") },
  ], []);

  function reset() { setFiles([]); setOutputs([]); setError(""); setProgress(0); setStage("Ready for material"); setBusy(false); if (input.current) input.current.value = ""; }
  function selectTool(id: ToolId) { setToolId(id); reset(); }
  function acceptedTypes() {
    switch (toolId) {
      case "png-jpg": return { label: "PNG", accept: "image/png,.png", extensions: [".png"] };
      case "jpg-png": return { label: "JPG / JPEG", accept: "image/jpeg,.jpg,.jpeg", extensions: [".jpg", ".jpeg"] };
      case "webp-jpg": return { label: "WEBP", accept: "image/webp,.webp", extensions: [".webp"] };
      case "jpg-webp": return { label: "JPG / JPEG", accept: "image/jpeg,.jpg,.jpeg", extensions: [".jpg", ".jpeg"] };
      case "image-pdf": return { label: "PNG / JPG / JPEG / WEBP", accept: "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp", extensions: [".png", ".jpg", ".jpeg", ".webp"] };
      case "pdf-image":
      case "merge":
      case "split": return { label: "PDF", accept: ".pdf,application/pdf", extensions: [".pdf"] };
      case "compress":
      case "resize": return { label: "Image", accept: "image/*", extensions: [] };
    }
  }
  function maxFileSize() { return tool.group === "PDF" && toolId !== "image-pdf" ? MAX_PDF_SIZE : MAX_IMAGE_SIZE; }
  function accepts(file: File) {
    const name = file.name.toLowerCase();
    if (toolId === "png-jpg") return file.type === "image/png" || name.endsWith(".png");
    if (toolId === "jpg-png" || toolId === "jpg-webp") return file.type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg");
    if (toolId === "webp-jpg") return file.type === "image/webp" || name.endsWith(".webp");
    if (toolId === "image-pdf") return [".png", ".jpg", ".jpeg", ".webp"].some(ext => name.endsWith(ext)) || ["image/png", "image/jpeg", "image/webp"].includes(file.type);
    if (toolId === "compress" || toolId === "resize") return file.type.startsWith("image/");
    return file.type === "application/pdf" || name.endsWith(".pdf");
  }
  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const invalid = incoming.find(file => !accepts(file));
    if (invalid) { setError(`${invalid.name} is not a supported ${acceptedTypes().label} file for this tool.`); return; }
    const limit = maxFileSize();
    const tooLarge = incoming.find(file => file.size > limit);
    if (tooLarge) { setError(`${tooLarge.name} is too large. Maximum allowed is ${bytes(limit)} per file.`); return; }
    const currentSize = files.reduce((sum, file) => sum + file.size, 0);
    const incomingSize = incoming.reduce((sum, file) => sum + file.size, 0);
    if (currentSize + incomingSize > MAX_BATCH_SIZE) { setError(`The total upload limit is ${bytes(MAX_BATCH_SIZE)}. Remove some files before adding more.`); return; }
    setError(""); setOutputs([]); setProgress(0); setFiles(prev => toolId === "split" ? incoming.slice(0, 1) : [...prev, ...incoming]);
  }
  function pick(e: ChangeEvent<HTMLInputElement>) { if (e.target.files) addFiles(e.target.files); }
  function drop(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }

  async function imageBlob(file: File, mime: string, w?: number, h?: number) {
    const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
    const canvas = document.createElement("canvas"); canvas.width = w || img.naturalWidth; canvas.height = h || img.naturalHeight;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable");
    if (mime === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url);
    return new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Encoding failed")), mime, quality / 100));
  }

  async function pdfFromImages(inputFiles: File[]) {
    const pdf = await PDFDocument.create();
    for (const f of inputFiles) {
      const blob = await imageBlob(f, f.type === "image/png" ? "image/png" : "image/jpeg");
      const buf = await blob.arrayBuffer(); const image = f.type === "image/png" ? await pdf.embedPng(buf) : await pdf.embedJpg(buf);
      const page = pdf.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    return new Blob([toArrayBuffer(await pdf.save())], { type: "application/pdf" });
  }

  async function renderPdf(file: File) {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const data = new Uint8Array(await file.arrayBuffer()); const pdf = await pdfjsLib.getDocument({ data }).promise; const result: Output[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      setStage(`Rendering page ${i} of ${pdf.numPages}`); setProgress(Math.round(((i - 1) / pdf.numPages) * 100));
      const page = await pdf.getPage(i); const viewport = page.getViewport({ scale: 1.6 }); const canvas = document.createElement("canvas"); canvas.width = viewport.width; canvas.height = viewport.height;
      const ctx = canvas.getContext("2d"); if (!ctx) continue; await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Render failed")), `image/${format}`));
      result.push({ name: `${file.name.replace(/\.pdf$/i, "")}-page-${i}.${format}`, blob, inputSize: file.size }); setProgress(Math.round((i / pdf.numPages) * 100));
    }
    return result;
  }

  async function mergePdfs(inputFiles: File[]) {
    const out = await PDFDocument.create();
    for (let i = 0; i < inputFiles.length; i++) { setStage(`Joining document ${i + 1} of ${inputFiles.length}`); setProgress(Math.round((i / inputFiles.length) * 100)); const src = await PDFDocument.load(await inputFiles[i].arrayBuffer()); const pages = await out.copyPages(src, src.getPageIndices()); pages.forEach(p => out.addPage(p)); }
    setProgress(100); return new Blob([toArrayBuffer(await out.save())], { type: "application/pdf" });
  }

  async function splitPdf(file: File) {
    const src = await PDFDocument.load(await file.arrayBuffer()); const out = await PDFDocument.create(); const index = Math.max(0, Math.min(src.getPageCount() - 1, splitPage - 1));
    const [page] = await out.copyPages(src, [index]); out.addPage(page); setProgress(100); return new Blob([toArrayBuffer(await out.save())], { type: "application/pdf" });
  }

  async function convert() {
    if (!files.length || busy) return; setBusy(true); setOutputs([]); setError(""); setProgress(3); setStage("Inspecting material…");
    try {
      const result: Output[] = [];
      if (toolId === "image-pdf") { setStage(`Building PDF from ${files.length} image${files.length > 1 ? "s" : ""}…`); const blob = await pdfFromImages(files); result.push({ name: "convertX-workshop.pdf", blob, inputSize: totalInput }); }
      else if (toolId === "pdf-image") { for (const f of files) result.push(...await renderPdf(f)); }
      else if (toolId === "merge") { setStage("Preparing PDF merge…"); result.push({ name: "convertX-merged.pdf", blob: await mergePdfs(files), inputSize: totalInput }); }
      else if (toolId === "split") { setStage(`Extracting page ${splitPage}…`); result.push({ name: `${files[0].name.replace(/\.pdf$/i, "")}-page-${splitPage}.pdf`, blob: await splitPdf(files[0]), inputSize: files[0].size }); }
      else {
        for (let i = 0; i < files.length; i++) {
          const f = files[i]; setStage(`Processing ${f.name}`); setProgress(Math.round((i / files.length) * 100));
          const mime = toolId === "jpg-png" ? "image/png" : toolId === "jpg-webp" ? "image/webp" : "image/jpeg";
          const blob = await imageBlob(f, mime, toolId === "resize" ? width : undefined, toolId === "resize" ? height : undefined);
          const suffix = toolId === "compress" ? "compressed" : toolId === "resize" ? "resized" : mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
          result.push({ name: `${f.name.replace(/\.[^.]+$/, "")}-${suffix}.${suffix}`, blob, inputSize: f.size }); setProgress(Math.round(((i + 1) / files.length) * 100));
        }
      }
      setOutputs(result); setProgress(100); setStage("Workshop complete");
    } catch (e) { setError(e instanceof Error ? e.message : "The material could not be processed."); setStage("Bench stopped — check material"); }
    finally { setBusy(false); }
  }

  function download(item: Output) { const a = document.createElement("a"); a.href = URL.createObjectURL(item.blob); a.download = item.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  function downloadAll() { outputs.forEach((x, i) => setTimeout(() => download(x), i * 150)); }

  return <main className="min-h-screen overflow-x-hidden bg-[#111315] text-[#f4f1e8] selection:bg-[#e0a14a] selection:text-black pb-32">
    <style>{`@keyframes drift{from{background-position:0 0,0 0}to{background-position:42px 42px,42px 42px}} @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(224,161,74,.45)}70%{box-shadow:0 0 0 14px rgba(224,161,74,0)}100%{box-shadow:0 0 0 0 rgba(224,161,74,0)}} .dock-item{transition:transform .2s cubic-bezier(.2,.8,.2,1),margin .2s cubic-bezier(.2,.8,.2,1)} .dock-item:hover{transform:translateY(-10px) scale(1.1);margin:0 7px}.dock-item:hover .dock-label{opacity:1;transform:translateY(0)} .dock-label{transition:opacity .15s ease,transform .15s ease}.work-grid{background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:42px 42px;animation:drift 16s linear infinite}`}</style>
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111315]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-[#e0a14a]/40 bg-[#1c1f21] text-[#e0a14a]"><Hammer size={18}/></div><div><div className="text-sm font-black tracking-tight">ConvertX</div><div className="text-[9px] font-bold uppercase tracking-[.28em] text-white/35">Digital Workshop</div></div></div>
        <div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/35 sm:flex"><ShieldCheck size={14} className="text-[#78b98b]"/> Local fabrication · No uploads</div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-[10px] text-white/45"><span className="h-1.5 w-1.5 rounded-full bg-[#78b98b] shadow-[0_0_10px_#78b98b]"/> ONLINE BENCH</div>
      </div>
    </header>

    <section className="work-grid relative min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5"><div><div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.25em] text-[#e0a14a]"><PackageOpen size={13}/> Active workbench</div><h1 className="text-3xl font-black tracking-[-.05em] sm:text-5xl">{tool.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">{tool.description}</p></div><div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-right"><div className="text-[9px] font-bold uppercase tracking-[.2em] text-white/30">Bench status</div><div className="mt-1 flex items-center justify-end gap-2 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${busy ? "animate-pulse bg-[#e0a14a]" : outputs.length ? "bg-[#78b98b]" : "bg-white/30"}`}/>{stage}</div></div></div>

        <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <div className="rounded-3xl border border-white/10 bg-[#181b1d]/85 p-4 shadow-2xl shadow-black/30 sm:p-6">
            {files.length === 0 ? <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={drop} onClick={()=>input.current?.click()} className={`group relative min-h-[420px] cursor-pointer overflow-hidden rounded-2xl border border-dashed ${dragging ? "border-[#e0a14a] bg-[#e0a14a]/10" : "border-white/15 bg-[#101214] hover:border-white/30"}`}>
              <input ref={input} type="file" multiple accept={acceptedTypes().accept} className="hidden" onChange={pick}/>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,161,74,.08),transparent_45%)]"/>
              <div className="relative grid min-h-[420px] place-items-center p-8 text-center"><div><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-[#e0a14a]/30 bg-[#211d17] text-[#e0a14a] shadow-2xl shadow-black/40 group-hover:animate-[pulseRing_2s_infinite]"><Upload size={30}/></div><div className="mt-7 text-[10px] font-black uppercase tracking-[.25em] text-white/30">Material intake</div><h2 className="mt-2 text-2xl font-bold">Drop {tool.from} material here</h2><p className="mt-2 text-sm text-white/40">or click anywhere to load files from this device</p><div className="mt-4 text-[10px] font-bold uppercase tracking-[.12em] text-white/25">Accepted: {acceptedTypes().label} · Max {bytes(maxFileSize())} per file · {bytes(MAX_BATCH_SIZE)} total</div><div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e0a14a] px-5 py-3 text-sm font-black text-black"><Upload size={16}/> Load material</div><p className="mt-5 text-[10px] uppercase tracking-[.16em] text-white/25">Browser processing · files never leave this workstation</p></div></div>
            </div> : <div>
              <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[.22em] text-[#e0a14a]">Material queue</div><div className="mt-1 text-sm font-bold">{files.length} item{files.length > 1 ? "s" : ""} · {bytes(totalInput)}</div></div><div className="flex gap-2"><button onClick={()=>input.current?.click()} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/60 hover:bg-white/5">Add more</button><button onClick={reset} className="rounded-lg border border-white/10 p-2 text-white/45 hover:bg-white/5"><X size={16}/></button></div></div>
              <div className="mt-5 grid gap-2">{files.map((f,i)=><div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-white/7 bg-[#101214] p-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/5 text-[#e0a14a]"><FileImage size={17}/></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{f.name}</div><div className="mt-0.5 text-[10px] uppercase tracking-[.1em] text-white/30">{ext(f.name)} · {bytes(f.size)}</div></div><button onClick={()=>setFiles(prev=>prev.filter((_,j)=>j!==i))} className="rounded-md p-2 text-white/25 hover:bg-white/5 hover:text-white"><X size={15}/></button></div>)}</div>

              {toolId === "resize" && <div className="mt-5 grid grid-cols-2 gap-3"><label className="rounded-xl border border-white/8 bg-[#101214] p-3"><span className="text-[9px] font-bold uppercase tracking-[.16em] text-white/30">Width</span><input type="number" min={1} value={width} onChange={e=>setWidth(Math.max(1,Number(e.target.value)||1))} className="mt-2 w-full bg-transparent text-lg font-bold outline-none"/></label><label className="rounded-xl border border-white/8 bg-[#101214] p-3"><span className="text-[9px] font-bold uppercase tracking-[.16em] text-white/30">Height</span><input type="number" min={1} value={height} onChange={e=>setHeight(Math.max(1,Number(e.target.value)||1))} className="mt-2 w-full bg-transparent text-lg font-bold outline-none"/></label></div>}
              {(toolId === "compress" || toolId === "png-jpg" || toolId === "jpg-png" || toolId === "webp-jpg" || toolId === "jpg-webp") && <div className="mt-5 rounded-xl border border-white/8 bg-[#101214] p-4"><div className="flex justify-between text-[10px] font-black uppercase tracking-[.16em] text-white/40"><span>Output quality</span><span className="text-[#e0a14a]">{quality}%</span></div><input type="range" min="40" max="100" value={quality} onChange={e=>setQuality(Number(e.target.value))} className="mt-4 w-full accent-[#e0a14a]"/></div>}
              {toolId === "pdf-image" && <div className="mt-5 flex items-center justify-between rounded-xl border border-white/8 bg-[#101214] p-4"><div><div className="text-xs font-bold">Render format</div><div className="mt-1 text-[10px] text-white/35">One image per PDF page</div></div><select value={format} onChange={e=>setFormat(e.target.value as "jpg"|"png")} className="rounded-lg border border-white/10 bg-[#181b1d] px-3 py-2 text-xs font-bold"><option value="jpg">JPG</option><option value="png">PNG</option></select></div>}
              {toolId === "split" && <div className="mt-5 flex items-center justify-between rounded-xl border border-white/8 bg-[#101214] p-4"><div><div className="text-xs font-bold">Page extraction</div><div className="mt-1 text-[10px] text-white/35">Choose the page to separate</div></div><input type="number" min={1} value={splitPage} onChange={e=>setSplitPage(Math.max(1,Number(e.target.value)||1))} className="w-20 rounded-lg border border-white/10 bg-[#181b1d] px-3 py-2 text-center text-sm font-bold"/></div>}

              {busy && <div className="mt-5 overflow-hidden rounded-xl border border-[#e0a14a]/20 bg-[#211d17] p-4"><div className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-bold"><RefreshCw size={14} className="animate-spin text-[#e0a14a]"/> {stage}</span><span className="font-black text-[#e0a14a]">{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full bg-[#e0a14a] transition-all duration-300" style={{width:`${progress}%`}}/></div><div className="mt-2 flex justify-between text-[9px] uppercase tracking-[.14em] text-white/25"><span>Reading</span><span>Processing</span><span>Finishing</span></div></div>}
              <button onClick={convert} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e0a14a] py-4 text-sm font-black text-black shadow-lg shadow-[#e0a14a]/10 transition hover:-translate-y-0.5 disabled:opacity-50">{busy ? "Workshop is running…" : "Start fabrication"} <ArrowRight size={17}/></button>
              {error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
            </div>}

            {outputs.length > 0 && <div className="mt-6 rounded-2xl border border-[#78b98b]/20 bg-[#151b17] p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-[#78b98b]"><Check size={13}/> Fabrication complete</div><div className="mt-1 text-sm font-bold">{outputs.length} output{outputs.length > 1 ? "s" : ""} ready · {bytes(totalOutput)}{reduction > 0 && ` · ${reduction}% lighter`}</div></div><button onClick={downloadAll} className="inline-flex items-center gap-2 rounded-lg bg-[#78b98b] px-4 py-2 text-xs font-black text-black"><ArrowDownToLine size={14}/> Download all</button></div><div className="mt-4 grid gap-2">{outputs.map((o,i)=><div key={`${o.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-white/7 bg-black/20 p-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#78b98b]/10 text-[#78b98b]"><Check size={15}/></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{o.name}</div><div className="text-[9px] uppercase tracking-[.1em] text-white/30">{bytes(o.blob.size)}</div></div><button onClick={()=>download(o)} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold">Download</button></div>)}</div></div>}
          </div>

          <aside className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#181b1d]/85 p-5 shadow-2xl shadow-black/20"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.22em] text-white/30"><Settings2 size={14}/> Tool specification</div><div className="mt-5 rounded-2xl border border-white/8 bg-[#101214] p-5"><div className="text-2xl font-black tracking-tight">{tool.short}</div><p className="mt-2 text-xs leading-5 text-white/40">{tool.description}</p><div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/[.03] p-3"><div className="text-[8px] font-bold uppercase tracking-[.15em] text-white/25">Input</div><div className="mt-1 text-sm font-bold">{tool.from}</div></div><div className="rounded-xl bg-white/[.03] p-3"><div className="text-[8px] font-bold uppercase tracking-[.15em] text-white/25">Output</div><div className="mt-1 text-sm font-bold">{tool.to}</div></div></div></div><div className="mt-4 space-y-2 text-[10px] text-white/40"><div className="flex items-center gap-2"><Zap size={13} className="text-[#e0a14a]"/> Hardware-free browser processing</div><div className="flex items-center gap-2"><ShieldCheck size={13} className="text-[#78b98b]"/> No file upload required</div><div className="flex items-center gap-2"><Minimize2 size={13} className="text-white/50"/> Output generated locally</div></div><a href="https://www.techcraftsolution.com" target="_blank" rel="noopener noreferrer" className="mt-auto block pt-10 text-center text-[13px] font-semibold tracking-[.04em] text-white/45 transition hover:text-white/75">Made with <span className="text-[#38bdf8] text-[16px]">♥</span> by <span className="font-bold text-[#38bdf8] underline underline-offset-2">TechCraft</span></a></aside>
        </div>
      </div>
    </section>

    <nav className="desktop-tool-dock fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-[26px] border border-white/15 bg-[#1b1e20]/95 px-2 pb-2 pt-2 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:bottom-4">
      <div className="flex max-w-[calc(100vw-20px)] items-end gap-1 overflow-visible px-1 pt-1 scrollbar-none">
        {grouped.flatMap(g=>g.items).map(t=>{const Active=t.id===toolId; return <button key={t.id} onClick={()=>selectTool(t.id)} aria-label={t.title} className="dock-item group relative flex w-[68px] shrink-0 flex-col items-center justify-end gap-1 rounded-2xl p-1.5 text-white/50">
          <span className={`grid h-11 w-11 place-items-center rounded-[15px] border shadow-lg transition ${Active ? "scale-105 border-white/30" : "border-white/10"}`} style={{color:t.color, backgroundColor:t.tint, boxShadow:Active ? `0 8px 24px ${t.color}35` : undefined}}><t.icon size={20} strokeWidth={2.2}/></span>
          <span className={`dock-label pointer-events-none max-w-[66px] truncate text-center text-[8px] font-bold leading-3 tracking-tight text-white ${Active ? "opacity-100 translate-y-0" : "opacity-75"}`}>{t.title}</span>
        </button>})}
      </div>
    </nav>

    <div className="mobile-tool-launcher">
      {mobileToolsOpen && <button aria-label="Close tools" className="mobile-tool-backdrop" onClick={()=>setMobileToolsOpen(false)} />}
      {mobileToolsOpen && <div className="mobile-tool-panel">
        <div className="mobile-tool-panel-title">Choose a tool</div>
        <div className="mobile-tool-grid">
          {tools.map(t=>{const Active=t.id===toolId; return <button key={t.id} onClick={()=>{selectTool(t.id);setMobileToolsOpen(false)}} aria-label={t.title} className={`mobile-tool-button ${Active ? "is-active" : ""}`}>
            <span className="mobile-tool-icon" style={{color:t.color,backgroundColor:t.tint}}><t.icon size={20} strokeWidth={2.2}/></span>
            <span className="mobile-tool-name">{t.title}</span>
          </button>})}
        </div>
      </div>}
      <button type="button" aria-expanded={mobileToolsOpen} aria-label={mobileToolsOpen ? "Close tools" : "Open tools"} onClick={()=>setMobileToolsOpen(v=>!v)} className="mobile-tool-toggle"><span></span><span></span><span></span></button>
    </div>
  </main>;
}
