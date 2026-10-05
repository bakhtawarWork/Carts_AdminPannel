"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const titles: Record<string, string> = {
  "popular-items": "Most Popular Items",
  "popular-vendors": "Most Popular Vendors",
  "popular-categories": "Most Popular Categories",
  "popular-collections": "Popular Collections",
  "vip-users": "VIP Users",
};

export default function AnalysisDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const title = titles[slug] ?? "Analysis";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-8">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-brand hover:text-brand-hover"
      >
        ← Back to dashboard
      </Link>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        This report view is ready for API data. Bind the list endpoint here when
        available.
      </p>
    </div>
  );
}
