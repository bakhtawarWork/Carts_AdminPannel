"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchVendorReviews,
  formatReviewScore,
  formatVendorReviewDate,
} from "@/lib/vendor-reviews";
import type { VendorReviewRecord } from "@/lib/types";

type VendorReviewsViewProps = {
  vendorId: string;
};

export default function VendorReviewsView({ vendorId }: VendorReviewsViewProps) {
  const [vendorName, setVendorName] = useState<{ en: string; ar: string } | null>(
    null,
  );
  const [reviews, setReviews] = useState<VendorReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchVendorReviews(vendorId);
      setVendorName(response.vendor.name);
      setReviews(response.reviews);
    } catch (caught) {
      setVendorName(null);
      setReviews([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load vendor reviews.",
      );
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Loading reviews…
      </div>
    );
  }

  if (!vendorName) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-12 text-center text-sm text-red-700">
        {error ?? "Unable to load vendor reviews."}
      </div>
    );
  }

  const vendorLabel = [vendorName.en, vendorName.ar]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          <Link href="/vendors" className="hover:underline">
            Vendors
          </Link>
          <span className="mx-1.5 text-slate-400">/</span>
          <span>Reviews</span>
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Customer Review
        </h2>
        <p className="mt-1 text-sm text-slate-500" dir="auto">
          {vendorLabel}
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Service</th>
                <th className="px-4 py-3.5">Quality</th>
                <th className="px-4 py-3.5">Respect Of Time</th>
                <th className="px-4 py-3.5">Presentation</th>
                <th className="px-4 py-3.5">Review Text</th>
                <th className="px-4 py-3.5">Created At</th>
                <th className="px-4 py-3.5">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No reviews for this vendor yet.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <ReviewRow key={review.id} review={review} />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 lg:hidden">
          {reviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No reviews for this vendor yet.
            </p>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ review }: { review: VendorReviewRecord }) {
  return (
    <tr className="align-top text-slate-700">
      <td className="px-4 py-3.5 font-medium text-slate-900">{review.userName}</td>
      <td className="px-4 py-3.5 tabular-nums">
        {formatReviewScore(review.serviceScore)}
      </td>
      <td className="px-4 py-3.5 tabular-nums">
        {formatReviewScore(review.qualityScore)}
      </td>
      <td className="px-4 py-3.5 tabular-nums">
        {formatReviewScore(review.respectOfTimeScore)}
      </td>
      <td className="px-4 py-3.5 tabular-nums">
        {formatReviewScore(review.presentationScore)}
      </td>
      <td className="max-w-[260px] px-4 py-3.5 text-slate-600">
        {review.reviewText || ""}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
        {formatVendorReviewDate(review.createdAt)}
      </td>
      <td className="px-4 py-3.5">
        <OrderDetailsButton orderId={review.orderId} />
      </td>
    </tr>
  );
}

function ReviewCard({ review }: { review: VendorReviewRecord }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{review.userName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatVendorReviewDate(review.createdAt)}
          </p>
        </div>
        <OrderDetailsButton orderId={review.orderId} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <ScoreStat label="Service" value={review.serviceScore} />
        <ScoreStat label="Quality" value={review.qualityScore} />
        <ScoreStat label="Respect Of Time" value={review.respectOfTimeScore} />
        <ScoreStat label="Presentation" value={review.presentationScore} />
      </dl>

      {review.reviewText ? (
        <p className="mt-3 text-sm text-slate-600">{review.reviewText}</p>
      ) : null}
    </article>
  );
}

function ScoreStat({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">
        {formatReviewScore(value)}
      </dd>
    </div>
  );
}

function OrderDetailsButton({ orderId }: { orderId: string }) {
  if (!orderId) {
    return (
      <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-400">
        Details
      </span>
    );
  }

  return (
    <Link
      href={`/orders/${orderId}`}
      className="inline-flex rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
      aria-label={`View details for order ${orderId}`}
    >
      Details
    </Link>
  );
}
