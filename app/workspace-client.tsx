"use client";

import dynamic from "next/dynamic";

const Workspace = dynamic(() => import("./workspace"), {
  ssr: false,
  loading: () => (
    <main className="grid min-h-screen place-items-center bg-[#f4f5f7] text-sm text-black/50">
      Loading ConvertX…
    </main>
  ),
});

export default function WorkspaceClient() {
  return <Workspace />;
}
