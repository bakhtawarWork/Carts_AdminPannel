"use client";

type PaginationBarProps = {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function PaginationBar({
  total,
  page,
  pageSize,
  onPageChange,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-3 rounded-b-2xl bg-slate-900 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-slate-200">
        <span className="font-medium text-white">
          {total.toLocaleString("en-US")}
        </span>{" "}
        total
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <PagerButton
          label="First page"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
        >
          <FirstIcon />
        </PagerButton>
        <PagerButton
          label="Previous page"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <PrevIcon />
        </PagerButton>

        {pages.map((entry, index) =>
          entry === "…" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              className={`min-w-8 rounded-md px-2.5 py-1.5 text-sm transition ${
                entry === currentPage
                  ? "bg-white/15 font-semibold text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {entry}
            </button>
          ),
        )}

        <PagerButton
          label="Next page"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <NextIcon />
        </PagerButton>
        <PagerButton
          label="Last page"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          <LastIcon />
        </PagerButton>
      </div>
    </div>
  );
}

function PagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function getVisiblePages(current: number, total: number): Array<number | "…"> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, 5, "…", total];
  }

  if (current >= total - 2) {
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "…", current - 1, current, current + 1, "…", total];
}

function FirstIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 6 5 12l6 6M18 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m14 6-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m10 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LastIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m6 6 6 6-6 6M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
