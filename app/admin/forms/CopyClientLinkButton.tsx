"use client";

import { useState } from "react";

export default function CopyClientLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const relativeUrl = `/f/${encodeURIComponent(slug)}`;

  async function onCopy() {
    try {
      const origin = window.location.origin;
      const absoluteUrl = `${origin}${relativeUrl}`;
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={
        "rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition-all hover:bg-zinc-100 " +
        (copied ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "")
      }
      aria-label="העתק קישור ללקוח"
      title={relativeUrl}
    >
      {copied ? "הועתק" : "העתק קישור"}
    </button>
  );
}
