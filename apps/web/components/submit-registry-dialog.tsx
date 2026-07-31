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
const AGENT_PROMPT = `Submit my shadcn registry to registry.directory following the instructions at ${DOCS_URL}`;
const CURL_SNIPPET = `curl -X POST https://registry.directory/api/submit \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Your Registry",
    "description": "What it provides.",
    "url": "https://example.com/",
    "registry_url": "https://example.com/r/registry.json"
  }'`;

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

function SubmitRegistryModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
        <div className="mb-4 flex items-start justify-between gap-4 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300">
          <div>
            <h2 className="text-base font-semibold text-balance">
              Submit your registry
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              One POST, no account, no fork. Hand the instructions to your
              agent — or run the request yourself.
            </p>
          </div>
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

        <div className="space-y-4">
          <div
            className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300"
            style={{ animationDelay: "75ms" }}
          >
            <CopyBlock label="Tell your agent" text={AGENT_PROMPT} />
          </div>
          <div
            className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300"
            style={{ animationDelay: "150ms" }}
          >
            <CopyBlock label="Or do it yourself" text={CURL_SNIPPET} />
          </div>
        </div>

        <p
          className="mt-4 text-xs text-muted-foreground text-pretty animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300"
          style={{ animationDelay: "225ms" }}
        >
          Full contract — fields, responses, updates:{" "}
          <a
            href={DOCS_PATH}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-foreground underline underline-offset-2"
          >
            /how-to-submit.md
          </a>
          . Every submission is audited before listing: your registry must
          resolve with real, installable content.
        </p>
      </div>
    </div>
  );
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
