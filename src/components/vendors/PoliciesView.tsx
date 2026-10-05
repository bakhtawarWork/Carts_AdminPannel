"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchPolicy,
  fetchPolicyVersions,
  formatPolicyDate,
  POLICY_CHAR_LIMIT,
  policyStatusLabel,
  publishPolicy,
  savePolicyDraft,
} from "@/lib/policies";
import type { PolicyDocument, PolicyVersion } from "@/lib/types";

type EditorLang = "english" | "arabic";
type ViewMode = "split" | "english" | "arabic" | "preview";

const textareaClass =
  "min-h-[280px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function PoliciesView() {
  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [englishContent, setEnglishContent] = useState("");
  const [arabicContent, setArabicContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [previewLang, setPreviewLang] = useState<EditorLang>("english");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<EditorLang>("english");

  const englishRef = useRef<HTMLTextAreaElement>(null);
  const arabicRef = useRef<HTMLTextAreaElement>(null);

  const loadPolicy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [policyData, versionData] = await Promise.all([
        fetchPolicy(),
        fetchPolicyVersions(),
      ]);
      setPolicy(policyData);
      setEnglishContent(policyData.englishContent);
      setArabicContent(policyData.arabicContent);
      setVersions(versionData);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load policies.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  const englishCount = englishContent.length;
  const arabicCount = arabicContent.length;
  const isDirty =
    policy &&
    (englishContent !== policy.englishContent ||
      arabicContent !== policy.arabicContent);

  function applyFormat(action: "bold" | "italic" | "bullet" | "heading") {
    const field = activeField;
    const ref = field === "english" ? englishRef : arabicRef;
    const textarea = ref.current;
    if (!textarea) return;

    const value = field === "english" ? englishContent : arabicContent;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    let replacement = selected;

    if (action === "bold") {
      replacement = `<strong>${selected || "bold text"}</strong>`;
    }
    if (action === "italic") replacement = `<em>${selected || "italic text"}</em>`;
    if (action === "bullet") {
      const items = (selected || "List item")
        .split("\n")
        .map((line) => `<li>${line}</li>`)
        .join("");
      replacement = `<ul>${items}</ul>`;
    }
    if (action === "heading") {
      replacement = `<p><strong>${selected || "Heading"}</strong></p>`;
    }

    const nextValue = value.slice(0, start) + replacement + value.slice(end);
    if (field === "english") setEnglishContent(nextValue);
    else setArabicContent(nextValue);
    setMessage(null);
  }

  async function handleSaveDraft() {
    setSaving("draft");
    setError(null);
    setMessage(null);
    try {
      const saved = await savePolicyDraft({ englishContent, arabicContent });
      setPolicy(saved);
      setEnglishContent(saved.englishContent);
      setArabicContent(saved.arabicContent);
      const versionData = await fetchPolicyVersions();
      setVersions(versionData);
      setMessage("Draft saved.");
    } catch {
      setError("Could not save draft.");
    } finally {
      setSaving(null);
    }
  }

  async function handlePublish() {
    if (!englishContent.trim() || !arabicContent.trim()) {
      setError("Both English and Arabic policies are required before publishing.");
      return;
    }
    if (englishCount > POLICY_CHAR_LIMIT || arabicCount > POLICY_CHAR_LIMIT) {
      setError(`Each language must be ${POLICY_CHAR_LIMIT} characters or fewer.`);
      return;
    }

    setSaving("publish");
    setError(null);
    setMessage(null);
    try {
      const saved = await publishPolicy({ englishContent, arabicContent });
      setPolicy(saved);
      setEnglishContent(saved.englishContent);
      setArabicContent(saved.arabicContent);
      const versionData = await fetchPolicyVersions();
      setVersions(versionData);
      setMessage("Policy published to users.");
    } catch {
      setError("Could not publish policy.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Loading policies…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Vendors
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Policies
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Write bilingual vendor policies, preview how users will see them, then
            publish when ready.
          </p>
        </div>

        {policy && (policy.status || policy.updatedAt || isDirty) ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            {policy.status ? <StatusBadge status={policy.status} /> : null}
            {policy.updatedAt ? (
              <span className="text-slate-500">
                Updated {formatPolicyDate(policy.updatedAt)}
                {policy.updatedBy ? ` · ${policy.updatedBy}` : ""}
              </span>
            ) : null}
            {isDirty ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Unsaved changes
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <ViewTab active={viewMode === "split"} onClick={() => setViewMode("split")}>
            Side by side
          </ViewTab>
          <ViewTab
            active={viewMode === "english"}
            onClick={() => setViewMode("english")}
          >
            English
          </ViewTab>
          <ViewTab active={viewMode === "arabic"} onClick={() => setViewMode("arabic")}>
            Arabic
          </ViewTab>
          <ViewTab
            active={viewMode === "preview"}
            onClick={() => setViewMode("preview")}
          >
            Preview
          </ViewTab>
        </div>

        <FormatToolbar onAction={applyFormat} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {viewMode === "split" ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <EditorPanel
                label="English policy"
                lang="english"
                value={englishContent}
                count={englishCount}
                textareaRef={englishRef}
                onFocus={() => setActiveField("english")}
                onChange={setEnglishContent}
              />
              <EditorPanel
                label="Arabic policy"
                lang="arabic"
                value={arabicContent}
                count={arabicCount}
                textareaRef={arabicRef}
                onFocus={() => setActiveField("arabic")}
                onChange={setArabicContent}
              />
            </div>
          ) : viewMode === "preview" ? (
            <PreviewPanel
              englishContent={englishContent}
              arabicContent={arabicContent}
              previewLang={previewLang}
              onPreviewLangChange={setPreviewLang}
            />
          ) : (
            <EditorPanel
              label={viewMode === "english" ? "English policy" : "Arabic policy"}
              lang={viewMode}
              value={viewMode === "english" ? englishContent : arabicContent}
              count={viewMode === "english" ? englishCount : arabicCount}
              textareaRef={viewMode === "english" ? englishRef : arabicRef}
              onFocus={() => setActiveField(viewMode)}
              onChange={
                viewMode === "english" ? setEnglishContent : setArabicContent
              }
            />
          )}

          {viewMode !== "preview" ? (
            <PreviewPanel
              englishContent={englishContent}
              arabicContent={arabicContent}
              previewLang={previewLang}
              onPreviewLangChange={setPreviewLang}
              compact
            />
          ) : null}
        </div>

        <aside className="space-y-4">
          {versions.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <h3 className="text-sm font-semibold text-slate-900">Version history</h3>
              <p className="mt-1 text-xs text-slate-500">
                Recent saves and publishes for this policy.
              </p>
              <div className="mt-4 space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={version.status} small />
                      <span className="text-[11px] text-slate-500">
                        {formatPolicyDate(version.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-700">
                      {version.updatedBy}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500" dir="auto">
                      {version.englishPreview}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h3 className="text-sm font-semibold text-slate-900">Publishing tips</h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-500">
              <li>Keep English and Arabic content aligned before publishing.</li>
              <li>Use headings and bullet lists for easier reading in the app.</li>
              <li>Save a draft first if you need review before going live.</li>
            </ul>
          </section>
        </aside>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {policy?.status === "published"
            ? "Publishing will replace the live policy users see in the app."
            : policy?.status === "draft"
              ? "This policy is currently a draft and not visible to users."
              : "This is the current vendor policy."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving !== null}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={saving !== null}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving === "publish" ? "Publishing…" : "Publish to users"}
          </button>
        </div>
      </div>

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EditorPanel({
  label,
  lang,
  value,
  count,
  textareaRef,
  onFocus,
  onChange,
}: {
  label: string;
  lang: EditorLang;
  value: string;
  count: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onFocus: () => void;
  onChange: (value: string) => void;
}) {
  const overLimit = count > POLICY_CHAR_LIMIT;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
      </div>
      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          dir={lang === "arabic" ? "auto" : undefined}
          placeholder={
            lang === "english"
              ? "Write the policy users will read in English…"
              : "اكتب السياسة التي سيقرأها المستخدمون بالعربية…"
          }
          className={textareaClass}
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">HTML shown in the live preview</span>
          <span className={overLimit ? "font-semibold text-red-600" : "text-slate-500"}>
            {count}/{POLICY_CHAR_LIMIT}
          </span>
        </div>
      </div>
    </section>
  );
}

function PreviewPanel({
  englishContent,
  arabicContent,
  previewLang,
  onPreviewLangChange,
  compact = false,
}: {
  englishContent: string;
  arabicContent: string;
  previewLang: EditorLang;
  onPreviewLangChange: (lang: EditorLang) => void;
  compact?: boolean;
}) {
  const content = previewLang === "english" ? englishContent : arabicContent;

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${
        compact ? "" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Live preview</h3>
          <p className="text-xs text-slate-500">How users see the policy in the app</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <PreviewLangButton
            active={previewLang === "english"}
            onClick={() => onPreviewLangChange("english")}
          >
            EN
          </PreviewLangButton>
          <PreviewLangButton
            active={previewLang === "arabic"}
            onClick={() => onPreviewLangChange("arabic")}
          >
            AR
          </PreviewLangButton>
        </div>
      </div>

      <div className={`bg-slate-50/80 p-4 ${compact ? "" : "sm:p-6"}`}>
        <div className="mx-auto max-w-sm overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg">
          <div className="bg-brand px-4 py-3 text-center text-sm font-semibold text-white">
            Carts Policy
          </div>
          <div className="max-h-72 overflow-y-auto px-4 py-4">
            <PolicyPreviewContent content={content} dir={previewLang === "arabic" ? "rtl" : "ltr"} />
          </div>
        </div>
      </div>
    </section>
  );
}

const POLICY_HTML_TAGS = new Set([
  "p",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "a",
  "span",
]);

function sanitizePolicyHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  sanitizePolicyNode(doc.body);
  return doc.body.innerHTML;
}

function sanitizePolicyNode(node: Node) {
  let child = node.firstChild;
  while (child) {
    const next = child.nextSibling;
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as HTMLElement;
      const tag = element.tagName.toLowerCase();
      if (!POLICY_HTML_TAGS.has(tag)) {
        const firstInner = element.firstChild;
        while (element.firstChild) node.insertBefore(element.firstChild, element);
        node.removeChild(element);
        child = firstInner ?? next;
        continue;
      }

      for (const attr of [...element.attributes]) {
        const keepLink =
          tag === "a" &&
          attr.name === "href" &&
          /^(https?:|mailto:)/i.test(attr.value);
        if (!keepLink) element.removeAttribute(attr.name);
      }

      sanitizePolicyNode(element);
    }
    child = next;
  }
}

function PolicyPreviewContent({
  content,
  dir,
}: {
  content: string;
  dir: "ltr" | "rtl";
}) {
  if (!content.trim()) {
    return <p className="text-sm text-slate-400">Nothing to preview yet.</p>;
  }

  if (!/<\/?[a-z][\s\S]*>/i.test(content)) {
    return (
      <div className="space-y-2 text-sm leading-relaxed text-slate-700" dir={dir}>
        {content.split("\n").map((line, index) =>
          line.trim() ? (
            <p key={index}>{line}</p>
          ) : (
            <div key={index} className="h-2" />
          ),
        )}
      </div>
    );
  }

  return (
    <div
      className="text-sm leading-relaxed text-slate-700 [&_li]:mb-1 [&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:ps-5"
      dir={dir}
      dangerouslySetInnerHTML={{ __html: sanitizePolicyHtml(content) }}
    />
  );
}

function FormatToolbar({
  onAction,
}: {
  onAction: (action: "bold" | "italic" | "bullet" | "heading") => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <ToolbarButton label="Bold" onClick={() => onAction("bold")}>
        B
      </ToolbarButton>
      <ToolbarButton label="Italic" onClick={() => onAction("italic")}>
        I
      </ToolbarButton>
      <ToolbarButton label="Bullet list" onClick={() => onAction("bullet")}>
        •
      </ToolbarButton>
      <ToolbarButton label="Heading" onClick={() => onAction("heading")}>
        H
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </button>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function PreviewLangButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({
  status,
  small = false,
}: {
  status: PolicyDocument["status"];
  small?: boolean;
}) {
  const published = status === "published";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
        small ? "text-[11px]" : "text-xs"
      } ${
        published
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          published ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {policyStatusLabel(status)}
    </span>
  );
}
