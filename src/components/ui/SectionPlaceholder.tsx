type SectionPlaceholderProps = {
  section: string;
  title: string;
  description: string;
};

export function SectionPlaceholder({
  section,
  title,
  description,
}: SectionPlaceholderProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          {section}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <p className="text-sm font-medium text-slate-700">
          This section is ready in the sidebar.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          UI and data wiring will be added in the next step.
        </p>
      </div>
    </div>
  );
}
