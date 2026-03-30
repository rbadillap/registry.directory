"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { Bug, CircleHelp, Lightbulb, MessageSquare, X, type LucideIcon } from "lucide-react";
import type { FeedbackType } from "@/lib/feedback";

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: LucideIcon }[] = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "confusing", label: "Confusing", icon: CircleHelp },
  { value: "idea", label: "Idea", icon: Lightbulb },
];

type Status = "idle" | "submitting" | "success" | "error";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("confusing");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  if (process.env.NEXT_PUBLIC_FEEDBACK_ENABLED !== "true") {
    return null;
  }

  const toggle = useCallback(() => setIsOpen((o) => !o), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "." && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        setStatus("idle");
        setIsOpen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

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

  if (!isOpen) {
    return (
      <button
        onClick={toggle}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-lg transition-colors hover:bg-accent"
        aria-label="Send feedback (Cmd+.)"
        title="Send feedback (Cmd+.)"
      >
        <MessageSquare className="size-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-border bg-background shadow-lg">
      {status === "success" ? (
        <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
          Sent!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Feedback
            </span>
            <button
              type="button"
              onClick={toggle}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex gap-1.5">
            {FEEDBACK_TYPES.map((ft) => (
              <Button
                key={ft.value}
                type="button"
                variant={type === ft.value ? "default" : "secondary"}
                size="sm"
                onClick={() => setType(ft.value)}
                className="flex-1"
              >
                <ft.icon /> {ft.label}
              </Button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[100px] w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            maxLength={2000}
            autoFocus
          />

          {status === "error" && (
            <p className="text-xs text-destructive">
              Failed to send. Try again.
            </p>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={!message.trim() || status === "submitting"}
            className="w-full"
          >
            {status === "submitting" ? "Sending..." : "Send"}
          </Button>
        </form>
      )}
    </div>
  );
}
