"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
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
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-3" />
          ) : (
            <Copy className="size-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-md border bg-muted/50 p-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
        {text}
      </pre>
    </div>
  );
}

export function SubmitRegistryDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="size-3.5" />
        Submit registry
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Submit your registry"
        >
          <div
            className={cn(
              "w-full max-w-lg rounded-lg border bg-background p-5 shadow-lg",
              "max-h-[85vh] overflow-y-auto"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">
                  Submit your registry
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  One POST, no account, no fork. Hand the instructions to your
                  agent — or run the request yourself.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={close}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <CopyBlock label="Tell your agent" text={AGENT_PROMPT} />
              <CopyBlock label="Or do it yourself" text={CURL_SNIPPET} />
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
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
      )}
    </>
  );
}
