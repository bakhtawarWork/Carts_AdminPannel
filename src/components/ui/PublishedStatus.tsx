export function PublishedStatus({ published }: { published: boolean }) {
  return (
    <span
      className="inline-flex flex-col items-center gap-1"
      title={published ? "Published" : "Not published"}
    >
      {published ? <StatusCheckIcon /> : <StatusCrossIcon />}
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Published?
      </span>
    </span>
  );
}

export function PublishedStatusInline({ published }: { published: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2"
      title={published ? "Published" : "Not published"}
    >
      {published ? <StatusCheckIcon /> : <StatusCrossIcon />}
      <span className="hidden text-sm font-medium text-slate-600 xl:inline">
        {published ? "Published" : "Not published"}
      </span>
    </span>
  );
}

function StatusCheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="12" fill="#22C55E" />
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M7.2 12.3 10.4 15.4 16.8 8.6"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusCrossIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="12" fill="#EF4444" />
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8.2 8.2 15.8 15.8M15.8 8.2 8.2 15.8"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
