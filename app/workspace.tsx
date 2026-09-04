"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  FileImage,
  FileText,
  Files,
  Image as ImageIcon,
  Layers,
  Menu,
  Minus,
  Plus,
  RotateCcw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type ToolId = "png-jpg" | "jpg-png" | "webp-jpg" | "jpg-webp" | "image-pdf" | "pdf-image" | "compress" | "resize" | "merge" | "split";
type Category = "All tools" | "Images" | "PDF";

type Tool = { id: ToolId; title: string; description: string; category: Category; from: string; to: string; icon: typeof FileImage };

const tools: Tool[] = [
  { id: "png-jpg", title: "PNG → JPG", description: "Convert transparent PNGs to lightweight JPG files.", category: "Images", from: "PNG", to: "JPG", icon: FileImage },
  { id: "jpg-png", title: "JPG → PNG", description: "Turn JPG images into lossless PNG files.", category: "Images", from: "JPG", to: "PNG", icon: FileImage },
  { id: "webp-jpg", title: "WEBP → JPG", description: "Convert modern WEBP images to compatible JPGs.", category: "Images", from: "WEBP", to: "JPG", icon: FileImage },
  { id: "jpg-webp", title: "JPG → WEBP", description: "Create smaller WEBP images for the web.", category: "Images", from: "JPG", to: "WEBP", icon: FileImage },
  { id: "image-pdf", title: "Images → PDF", description: "Bundle one or many images into a PDF.", category: "PDF", from: "IMG", to: "PDF", icon: FileText },
  { id: "pdf-image", title: "PDF → JPG / PNG", description: "Render PDF pages into crisp images.", category: "PDF", from: "PDF", to: "IMG", icon: FileText },
  { id: "compress", title: "Image Compressor", description: "Reduce image size while controlling quality.", category: "Images", from: "IMG", to: "MIN", icon: Zap },
  { id: "resize", title: "Image Resizer", description: "Resize images to exact dimensions in seconds.", category: "Images", from: "IMG", to: "PX", icon: Layers },
  { id: "merge", title: "Merge PDF", description: "Combine multiple PDF files into one document.", category: "PDF", from: "PDF", to: "PDF", icon: Files },
  { id: "split", title: "Split PDF", description: "Extract selected pages into a new PDF.", category: "PDF", from: "PDF", to: "PDF", icon: Scissors },
];

function bytes(n: number) { if (n < 1024) return `${n} B`; if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`; return `${(n / 1048576).toFixed(2)} MB`; }
function ext(name: string) { return name.split(".").pop()?.toUpperCase() || "FILE"; }
function accepts(tool: Tool, file: File) {
  if (["image-pdf", "compress", "resize"].includes(tool.id)) return file.type.startsWith("image/");
  if (tool.id === "pdf-image" || tool.id === "merge" || tool.id === "split") return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  return [tool.from.toLowerCase(), "image/jpeg", "image/png", "image/webp"].some(x => file.type.includes(x) || file.name.toLowerCase().endsWith(`.${x}`));
}

export default function Workspace() {
  const input = useRef<HTMLInputElement>(null);
  const [toolId, setToolId] = useState<ToolId>("png-jpg");
  const [category, setCategory] = useState<Category>("All tools");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; blob: Blob }[]>([]);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(88);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [format, setFormat] = useState<"jpg" | "png">("jpg");
  const [splitPage, setSplitPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const tool = tools.find(t => t.id === toolId)!;
  const filtered = useMemo(() => category === "All tools" ? tools : tools.filter(t => t.category === category), [category]);

  function reset() { setFiles([]); setDone([]); setError(""); setBusy(false); if (input.current) input.current.value = ""; }
  function selectTool(id: ToolId) { setToolId(id); reset(); setMobileOpen(false); }
  function addFiles(list: FileList | File[]) {
    const picked = Array.from(list).filter(f => accepts(tool, f));
    setError(picked.length ? "" : `This tool expects ${tool.from} files.`);
    if (picked.length) { setFiles(prev => [...prev, ...picked]); setDone([]); }
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
    return new Blob([await pdf.save()], { type: "application/pdf" });
  }
  async function renderPdf(file: File) {
    const data = new Uint8Array(await file.arrayBuffer()); const pdf = await pdfjsLib.getDocument({ data }).promise; const results: { name: string; blob: Blob }[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i); const viewport = page.getViewport({ scale: 1.6 }); const canvas = document.createElement("canvas"); canvas.width = viewport.width; canvas.height = viewport.height;
      const ctx = canvas.getContext("2d"); if (!ctx) continue; await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Render failed")), `image/${format}`));
      results.push({ name: `${file.name.replace(/\.pdf$/i, "")}-page-${i}.${format}`, blob });
    } return results;
  }
  async function mergePdfs(inputFiles: File[]) {
    const out = await PDFDocument.create(); for (const f of inputFiles) { const src = await PDFDocument.load(await f.arrayBuffer()); const pages = await out.copyPages(src, src.getPageIndices()); pages.forEach(p => out.addPage(p)); }
    return new Blob([await out.save()], { type: "application/pdf" });
  }
  async function splitPdf(file: File) {
    const src = await PDFDocument.load(await file.arrayBuffer()); const out = await PDFDocument.create(); const index = Math.max(0, Math.min(src.getPageCount() - 1, splitPage - 1)); const [page] = await out.copyPages(src, [index]); out.addPage(page);
    return new Blob([await out.save()], { type: "application/pdf" });
  }
  async function convert() {
    if (!files.length) return; setBusy(true); setError(""); setDone([]);
    try {
      const results: { name: string; blob: Blob }[] = [];
      if (toolId === "image-pdf") results.push({ name: "convertX-images.pdf", blob: await pdfFromImages(files) });
      else if (toolId === "pdf-image") { for (const f of files) results.push(...await renderPdf(f)); }
      else if (toolId === "merge") results.push({ name: "convertX-merged.pdf", blob: await mergePdfs(files) });
      else if (toolId === "split") results.push({ name: `${files[0].name.replace(/\.pdf$/i, "")}-page-${splitPage}.pdf`, blob: await splitPdf(files[0]) });
      else {
        for (const f of files) {
          const mime = toolId === "jpg-png" ? "image/png" : toolId === "jpg-webp" ? "image/webp" : "image/jpeg";
          const targetW = toolId === "resize" ? width : undefined; const targetH = toolId === "resize" ? height : undefined;
          const blob = await imageBlob(f, mime, targetW, targetH); const suffix = toolId === "compress" ? "compressed" : toolId === "resize" ? "resized" : mime.split("/")[1];
          results.push({ name: `${f.name.replace(/\.[^.]+$/, "")}-${suffix}.${mime === "image/jpeg" ? "jpg" : mime.split("/")[1]}`, blob });
        }
      }
      setDone(results);
    } catch (e) { setError(e instanceof Error ? e.message : "Conversion failed. Try another file."); }
    finally { setBusy(false); }
  }
  function download(item: { name: string; blob: Blob }) { const a = document.createElement("a"); a.href = URL.createObjectURL(item.blob); a.download = item.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  function downloadAll() { done.forEach((x, i) => setTimeout(() => download(x), i * 150)); }

  return <main className="min-h-screen bg-[#f4f5f7] text-[#17191d] selection:bg-black selection:text-white">
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f4f5f7]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-black text-white"><Sparkles size={18}/></div><div><div className="text-[15px] font-bold tracking-tight">ConvertX</div><div className="hidden text-[10px] uppercase tracking-[.2em] text-black/40 sm:block">Conversion workspace</div></div></div>
        <div className="hidden items-center gap-2 text-xs text-black/45 md:flex"><ShieldCheck size={15}/> Local processing · No uploads</div>
        <button className="rounded-lg border border-black/10 bg-white p-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={19}/></button>
      </div>
    </header>
    <div className="mx-auto flex max-w-[1500px]">
      <aside className={`${mobileOpen ? "block" : "hidden"} fixed inset-x-0 top-16 z-20 border-b border-black/10 bg-[#f4f5f7] p-4 md:static md:block md:w-[270px] md:shrink-0 md:border-0 md:border-r md:bg-transparent md:p-5`}>
        <div className="mb-4 text-[10px] font-bold uppercase tracking-[.2em] text-black/35">Workspace</div>
        <nav className="mb-6 flex gap-1 rounded-xl bg-black/[.04] p-1 md:block md:bg-transparent md:p-0">
          {(["All tools", "Images", "PDF"] as Category[]).map(c => <button key={c} onClick={() => setCategory(c)} className={`flex-1 rounded-lg px-3 py-2 text-left text-sm md:mb-1 md:flex-none md:w-full ${category === c ? "bg-white font-semibold shadow-sm" : "text-black/55 hover:bg-white/60"}`}>{c}</button>)}
        </nav>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-black/35">Converters</div>
        <div className="grid max-h-[calc(100vh-210px)] gap-1 overflow-auto pr-1">
          {filtered.map(t => <button key={t.id} onClick={() => selectTool(t.id)} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${toolId === t.id ? "bg-black text-white shadow-lg shadow-black/10" : "hover:bg-white"}`}><t.icon size={17}/><span className="min-w-0"><span className="block text-sm font-medium">{t.title}</span><span className={`block truncate text-[10px] ${toolId === t.id ? "text-white/50" : "text-black/35"}`}>{t.description}</span></span></button>)}
        </div>
      </aside>
      <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1050px]">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-black/35">{tool.category} <ChevronDown size={13}/></div><h1 className="text-3xl font-bold tracking-[-.045em] sm:text-4xl">{tool.title}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-black/50">{tool.description}</p></div><div className="hidden items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/55 sm:flex"><Zap size={14}/> Fast · private · browser-based</div></div>
          {files.length === 0 ? <div onDragOver={e => {e.preventDefault();setDragging(true)}} onDragLeave={() => setDragging(false)} onDrop={drop} onClick={() => input.current?.click()} className={`relative min-h-[430px] cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition ${dragging ? "border-black bg-white" : "border-black/15 bg-white/65 hover:border-black/30"}`}>
            <input ref={input} type="file" multiple accept={tool.from === "PDF" ? ".pdf,application/pdf" : "image/*"} className="hidden" onChange={pick}/>
            <div className="absolute inset-0 opacity-[.035] [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:32px_32px]"/>
            <div className="relative flex min-h-[430px] flex-col items-center justify-center p-8 text-center"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-black text-white shadow-xl shadow-black/10"><Upload size={26}/></div><h2 className="mt-6 text-xl font-semibold">Drop files into the workspace</h2><p className="mt-2 max-w-sm text-sm leading-6 text-black/45">Drag & drop {tool.from} files here, or browse your device. Nothing leaves your browser.</p><button className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">Choose files <ArrowRight className="ml-1 inline" size={15}/></button><p className="mt-5 text-[11px] text-black/30">Supports batch processing</p></div>
          </div> : <div className="rounded-2xl border border-black/10 bg-white shadow-[0_20px_70px_-45px_rgba(0,0,0,.4)]">
            <div className="flex items-center justify-between border-b border-black/8 px-5 py-4"><div><div className="text-sm font-semibold">File queue</div><div className="text-xs text-black/40">{files.length} file{files.length > 1 ? "s" : ""} ready</div></div><button onClick={reset} className="rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black"><RotateCcw size={17}/></button></div>
            <div className="divide-y divide-black/6">{files.map((f,i) => <div key={`${f.name}-${i}`} className="flex items-center gap-3 px-5 py-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-black/[.04] text-[9px] font-bold">{ext(f.name).slice(0,4)}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{f.name}</div><div className="text-[11px] text-black/40">{bytes(f.size)}</div></div><Check size={16} className="text-black/35"/></div>)}</div>
            <div className="border-t border-black/8 bg-black/[.018] p-5">
              {toolId === "resize" && <div className="mb-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Width (px)<input type="number" value={width} onChange={e=>setWidth(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2.5 outline-none"/></label><label className="text-xs font-semibold">Height (px)<input type="number" value={height} onChange={e=>setHeight(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2.5 outline-none"/></label></div>}
              {toolId === "pdf-image" && <div className="mb-5 flex items-center gap-3"><span className="text-xs font-semibold">Output</span><button onClick={()=>setFormat("jpg")} className={`rounded-lg px-3 py-2 text-xs ${format === "jpg" ? "bg-black text-white" : "bg-white border border-black/10"}`}>JPG</button><button onClick={()=>setFormat("png")} className={`rounded-lg px-3 py-2 text-xs ${format === "png" ? "bg-black text-white" : "bg-white border border-black/10"}`}>PNG</button></div>}
              {toolId === "split" && <label className="mb-5 block text-xs font-semibold">Page to extract<input type="number" min="1" value={splitPage} onChange={e=>setSplitPage(Math.max(1,Number(e.target.value)))} className="mt-2 w-32 rounded-lg border border-black/10 px-3 py-2.5 outline-none"/></label>}
              {(toolId === "png-jpg" || toolId === "jpg-webp" || toolId === "webp-jpg" || toolId === "compress") && <div className="mb-5"><div className="flex justify-between text-xs font-semibold"><span>Quality</span><span>{quality}%</span></div><input type="range" min="40" max="100" value={quality} onChange={e=>setQuality(Number(e.target.value))} className="mt-3 w-full accent-black"/></div>}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><button onClick={() => input.current?.click()} className="text-sm font-medium text-black/50 hover:text-black"><Plus className="mr-1 inline" size={15}/> Add more files</button><button disabled={busy} onClick={convert} className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Converting…" : `Convert ${files.length} file${files.length > 1 ? "s" : ""}`} <ArrowRight className="ml-1 inline" size={15}/></button></div>
            </div>
          </div>}
          {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {done.length > 0 && <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold"><Check size={17}/> Conversion complete</div><div className="mt-1 text-xs text-black/40">{done.length} output{done.length > 1 ? "s" : ""} generated locally</div></div><button onClick={downloadAll} className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white"><ArrowDownToLine className="mr-1 inline" size={15}/> Download all</button></div><div className="mt-4 grid gap-2">{done.map((x,i)=><div key={i} className="flex items-center gap-3 rounded-xl bg-black/[.03] p-3"><FileText size={17}/><span className="min-w-0 flex-1 truncate text-sm">{x.name}<span className="ml-2 text-xs text-black/35">{bytes(x.blob.size)}</span></span><button onClick={()=>download(x)} className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold">Download</button></div>)}</div></div>}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-black/8 pt-5 text-[11px] text-black/35"><span>ConvertX keeps your files on your device whenever the browser supports the conversion.</span><span>Built for everyday file workflows.</span></div>
        </div>
      </section>
    </div>
  </main>;
}
