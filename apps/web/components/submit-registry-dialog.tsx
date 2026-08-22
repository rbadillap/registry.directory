"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Check, Copy, Plus, X } from "lucide-react";

const DOCS_PATH = "/how-to-submit.md";
const DOCS_URL = `https://registry.directory${DOCS_PATH}`;
// The short prompt is the whole protocol: agents discover the contract on
// their own via llms.txt, /docs, and openapi.json.
const AGENT_PROMPT = "submit my registry to registry.directory";

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the text is still selectable below.
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-xs transition-[background-color,scale] active:scale-[0.96]"
          onClick={handleCopy}
        >
          <span className="relative size-3">
            <Copy
              className={`absolute inset-0 size-3 transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                copied ? "scale-25 opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0"
              }`}
            />
            <Check
              className={`absolute inset-0 size-3 transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                copied ? "scale-100 opacity-100 blur-0" : "scale-25 opacity-0 blur-[4px]"
              }`}
            />
          </span>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto border border-border-subtle bg-muted/40 p-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
        {text}
      </pre>
    </div>
  );
}

type Fields = {
  name: string
  description: string
  url: string
  registry_url: string
  github_url: string
}

const EMPTY: Fields = { name: "", description: "", url: "", registry_url: "", github_url: "" }

const FIELDS: { key: keyof Fields; label: string; placeholder: string; required: boolean }[] = [
  { key: "name", label: "Name", placeholder: "Your Registry", required: true },
  { key: "description", label: "What it provides", placeholder: "Animated components built with motion.", required: true },
  { key: "url", label: "Site", placeholder: "https://example.com", required: true },
  { key: "registry_url", label: "registry.json", placeholder: "https://example.com/r/registry.json", required: true },
  { key: "github_url", label: "Repository", placeholder: "https://github.com/owner/repo", required: false },
]

function Field({
  field,
  value,
  onChange,
}: {
  field: (typeof FIELDS)[number]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="type-meta text-muted-foreground">
        {field.label}
        {field.required ? "" : " · optional"}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        autoComplete="off"
        spellCheck={false}
        className="w-full border border-input bg-background px-2.5 py-2 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-foreground-faint focus-visible:border-ring"
      />
    </label>
  )
}

/** Text that is meant to be copied, not followed. */
function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — the text stays selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex max-w-full items-center gap-1.5 text-left"
    >
      <code className="truncate font-mono text-xs text-foreground-secondary underline decoration-border-subtle underline-offset-4 group-hover:decoration-border">
        {text}
      </code>
      <span className="relative size-3 shrink-0 text-muted-foreground">
        <Copy
          className={`absolute inset-0 size-3 transition-opacity duration-200 ${copied ? "opacity-0" : "opacity-100"}`}
        />
        <Check
          className={`absolute inset-0 size-3 transition-opacity duration-200 ${copied ? "opacity-100" : "opacity-0"}`}
        />
      </span>
    </button>
  )
}

export function SubmitRegistryModal({ onClose }: { onClose: () => void }) {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    setError(null)
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        // The API explains what it refused and why; that is better than
        // anything this form could invent.
        setError(body?.error ?? `The submission was refused (${response.status}).`)
        setStatus("error")
        return
      }
      setStatus("sent")
    } catch {
      setError("The submission could not be sent. Check your connection and try again.")
      setStatus("error")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Submit your registry"
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto border bg-background p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3),0_24px_64px_rgba(0,0,0,0.25)] animate-in fade-in-0 zoom-in-95 duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="type-title">Submit your registry</h2>
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

        {status === "sent" ? (
          <div className="py-6">
            <p className="type-card text-foreground">Received.</p>
            <p className="mt-2 text-xs text-muted-foreground text-pretty">
              Every submission is read before it is listed, and the registry has
              to resolve with real, installable content.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {FIELDS.map((field) => (
                <Field
                  key={field.key}
                  field={field}
                  value={fields[field.key]}
                  onChange={(v) => setFields((f) => ({ ...f, [field.key]: v }))}
                />
              ))}

              {error && (
                <p className="text-xs text-destructive text-pretty">{error}</p>
              )}

              <Button
                type="submit"
                className="mt-1 w-full rounded-none"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending…" : "Submit"}
              </Button>
            </form>

            <div className="mt-6 border-t border-border-subtle pt-4">
              <p className="type-meta text-muted-foreground">
                Or hand it to an agent
              </p>
              <div className="mt-2">
                <CopyBlock label="" text={AGENT_PROMPT} />
              </div>
              <p className="mt-4 type-meta text-muted-foreground">
                The instructions it will follow
              </p>
              <div className="mt-1.5">
                <CopyLine text={DOCS_URL} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** The plain trigger, for a row of controls rather than a grid of cards. */
export function SubmitRegistryButton() {
  const [isOpen, setIsOpen] = useState(false)
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        aria-haspopup="dialog"
        aria-label="Submit your registry"
        title="Submit your registry"
      >
        <Plus className="size-4" />
      </button>
      {isOpen && <SubmitRegistryModal onClose={close} />}
    </>
  )
}

export function SubmitRegistryCard({ label }: { label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group h-full w-full text-left transition-[scale] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-haspopup="dialog"
      >
        <Card className="flex h-full flex-col overflow-hidden rounded-none border border-dashed border-border-subtle bg-background shadow-none transition-[border-color,box-shadow] hover:border-border hover:shadow-lg">
          <CardHeader className="flex min-h-[100px] flex-col items-center justify-center gap-2 bg-background pt-4 pb-3">
            <div className="flex-shrink-0">
              <Plus className="size-7 text-muted-foreground transition-[rotate,color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] group-hover:rotate-90 group-hover:text-foreground" />
            </div>
            <CardTitle className="text-center text-sm text-foreground">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between bg-background px-3 pt-0 pb-4">
            <CardDescription className="text-center text-xs text-muted-foreground">
              Share your registry with the community
            </CardDescription>
          </CardContent>
        </Card>
      </button>

      {isOpen && <SubmitRegistryModal onClose={close} />}
    </>
  );
}
