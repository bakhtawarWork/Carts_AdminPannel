"use client";

import Image from "next/image";

export function PublishedBadge({ published }: { published: boolean }) {
  return (
    <label
      className={`inline-flex items-center gap-2 text-sm ${
        published ? "text-slate-700" : "text-slate-500"
      }`}
    >
      <input
        type="checkbox"
        checked={published}
        readOnly
        className="h-4 w-4 rounded border-slate-300 accent-brand"
      />
      <span>{published ? "Published" : "Not published"}</span>
    </label>
  );
}

export function AnalysisThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <Image src={src} alt={alt} fill className="object-cover" sizes="96px" />
    </div>
  );
}

export function formatBilingual(primary: string, secondary?: string) {
  return secondary ? `${primary}/${secondary}` : primary;
}
