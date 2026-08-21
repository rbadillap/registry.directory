"use client";

import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Bug, CircleHelp, Lightbulb, X, type LucideIcon } from "lucide-react";
import type { FeedbackType } from "@/lib/feedback";

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: LucideIcon }[] = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "confusing", label: "Confusing", icon: CircleHelp },
  { value: "idea", label: "Idea", icon: Lightbulb },
];

type Status = "idle" | "submitting" | "success" | "error";

export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>("confusing");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          url: window.location.href,
          pathname: window.location.pathname,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        }),
      });

      if (!res.ok) throw new Error();

      setMessage("");
      setType("confusing");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  // Every hook above runs on every render. The flag decides what to paint,
  // not whether to call them: a return placed before them would change the
  // order React sees the moment the flag ever changed.
  if (process.env.NEXT_PUBLIC_FEEDBACK_ENABLED !== "true") {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Send feedback"
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto border bg-background p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3),0_24px_64px_rgba(0,0,0,0.25)] animate-in fade-in-0 zoom-in-95 duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="type-title">Send feedback</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-7 shrink-0 after:absolute after:-inset-2"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        {status === "success" ? (
          <div className="py-6">
            <p className="type-card text-foreground">Received.</p>
            <p className="mt-2 text-xs text-muted-foreground text-pretty">
              Every note is read. Nothing is sent back automatically.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="type-meta text-muted-foreground">Kind</span>
              <div className="flex gap-1.5">
                {FEEDBACK_TYPES.map((ft) => (
                  <Button
                    key={ft.value}
                    type="button"
                    variant={type === ft.value ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setType(ft.value)}
                    className="flex-1 rounded-none"
                  >
                    <ft.icon /> {ft.label}
                  </Button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="type-meta text-muted-foreground">What happened</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="The part that did not work, or the thing you expected to find."
                className="min-h-[120px] w-full resize-none border border-input bg-background px-2.5 py-2 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-foreground-faint focus-visible:border-ring"
                maxLength={2000}
                autoFocus
              />
            </label>

            {status === "error" && (
              <p className="text-xs text-destructive text-pretty">
                It could not be sent. Check your connection and try again.
              </p>
            )}

            <Button
              type="submit"
              className="mt-1 w-full rounded-none"
              disabled={!message.trim() || status === "submitting"}
            >
              {status === "submitting" ? "Sending…" : "Send"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
