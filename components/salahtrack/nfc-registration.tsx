"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Nfc,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmSheet } from "@/components/salahtrack/confirm-sheet";
import { SettingsSection } from "@/components/salahtrack/settings-sections";
import { ToastMessage, type Toast } from "@/components/salahtrack/toast";
import { InlineError, type LoadStatus } from "@/components/salahtrack/ui";
import { isLocalOnlyOrigin, scanPath, scanUrl } from "@/lib/nfc-link";
import {
  fetchMyNfcTag,
  NfcTagError,
  registerNfcTag,
  removeNfcTag,
  type NfcTag,
} from "@/lib/nfc-tags";

type CopyState = "idle" | "copied" | "failed";

function messageFor(error: unknown) {
  return error instanceof NfcTagError
    ? error.message
    : "Something went wrong. Please try again.";
}

/* -------------------------------------------------------------------------- */
/*  Container: talks to Supabase                                              */
/* -------------------------------------------------------------------------- */

export function NfcRegistration() {
  const [tag, setTag] = useState<NfcTag | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  const [registering, setRegistering] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [toast, setToast] = useState<Toast | null>(null);

  // The site address (e.g. http://localhost:3000), read in the browser.
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // 1. Check whether the user already has a registered tag.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchMyNfcTag()
      .then((found) => {
        if (cancelled) return;
        setTag(found);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = setTimeout(() => setCopyState("idle"), 2500);
    return () => clearTimeout(timer);
  }, [copyState]);

  // 2–3. Register: create a row owned by the signed-in user.
  async function register() {
    setRegistering(true);
    setActionError(null);
    try {
      const created = await registerNfcTag();
      setTag(created);
      setToast({ tone: "success", message: "NFC tag registered." });
    } catch (error: unknown) {
      if (error instanceof NfcTagError && error.kind === "duplicate") {
        // Already registered (e.g. in another tab): show the real one.
        setReloadKey((k) => k + 1);
      }
      setActionError(messageFor(error));
    } finally {
      setRegistering(false);
    }
  }

  // 5. Copy the link.
  async function copyLink() {
    if (!tag || !origin) return;
    try {
      await navigator.clipboard.writeText(scanUrl(origin, tag.id));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  // 6. Remove (only after the warning is confirmed).
  async function remove() {
    if (!tag) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await removeNfcTag(tag.id);
      setTag(null);
      setConfirmingRemove(false);
      setToast({ tone: "success", message: "NFC tag removed." });
    } catch (error: unknown) {
      if (error instanceof NfcTagError && error.kind === "not-found") {
        setTag(null);
        setConfirmingRemove(false);
        setReloadKey((k) => k + 1);
        setToast({ tone: "error", message: messageFor(error) });
      } else {
        setRemoveError(messageFor(error));
      }
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <NfcTagPanel
        status={status}
        tag={tag}
        origin={origin}
        onRetry={() => setReloadKey((k) => k + 1)}
        onRegister={register}
        registering={registering}
        actionError={actionError}
        onCopy={copyLink}
        copyState={copyState}
        onRequestRemove={() => {
          setRemoveError(null);
          setConfirmingRemove(true);
        }}
      />

      {confirmingRemove && (
        <ConfirmSheet
          icon={Trash2}
          tone="danger"
          title="Remove your NFC tag?"
          description="Your current NFC link will stop working straight away. If it's already written to a tag, you'll need to register a new tag and write the new link."
          confirmLabel="Remove tag"
          busyLabel="Removing…"
          saving={removing}
          error={removeError}
          onConfirm={remove}
          onCancel={() => {
            if (!removing) setConfirmingRemove(false);
          }}
        />
      )}

      {toast && <ToastMessage toast={toast} />}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Display                                                                   */
/* -------------------------------------------------------------------------- */

export function NfcTagPanel({
  status,
  tag,
  origin,
  onRetry,
  onRegister,
  registering,
  actionError,
  onCopy,
  copyState,
  onRequestRemove,
}: {
  status: LoadStatus;
  tag: NfcTag | null;
  origin: string | null;
  onRetry: () => void;
  onRegister: () => void;
  registering: boolean;
  actionError: string | null;
  onCopy: () => void;
  copyState: CopyState;
  onRequestRemove: () => void;
}) {
  const linkRef = useRef<HTMLParagraphElement>(null);

  // If copying fails, select the link so it can be copied by hand.
  useEffect(() => {
    if (copyState === "failed" && linkRef.current) {
      window.getSelection()?.selectAllChildren(linkRef.current);
    }
  }, [copyState]);

  return (
    <SettingsSection title="NFC bracelet" delay="delay-200">
      {status === "loading" && (
        <div className="flex items-center gap-4 px-5 py-5" aria-busy>
          <div className="size-12 shrink-0 animate-pulse rounded-2xl bg-stone-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
            <div className="h-3 w-56 animate-pulse rounded bg-stone-100" />
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="px-5 py-4">
          <InlineError message="Couldn't load your NFC tag." onRetry={onRetry} />
        </div>
      )}

      {status === "ready" && !tag && (
        <div className="px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Nfc className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">No NFC tag registered</p>
              <p className="mt-0.5 text-sm text-stone-500">
                Register a tag to get your personal check-in link. Tapping it
                opens SalahTrack so you can record a prayer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRegister}
            disabled={registering}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80"
          >
            {registering ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Registering…
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Register NFC Tag
              </>
            )}
          </button>
          {actionError && <ActionError message={actionError} />}
        </div>
      )}

      {status === "ready" && tag && (
        <div className="px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-700/25">
              <Nfc className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">NFC tag registered</p>
              <p className="mt-0.5 text-sm text-stone-500">
                Registered{" "}
                {new Date(tag.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* 4. The link */}
          <p
            id="nfc-link-label"
            className="mt-4 text-xs font-medium text-stone-500"
          >
            Your NFC link
          </p>
          <p
            ref={linkRef}
            aria-labelledby="nfc-link-label"
            className="mt-1 select-all break-all rounded-2xl bg-stone-50 px-4 py-3 font-mono text-xs leading-relaxed text-stone-700 ring-1 ring-inset ring-stone-200"
          >
            {origin ? scanUrl(origin, tag.id) : scanPath(tag.id)}
          </p>

          {/* 5. Copy, and open it to test in this browser */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCopy}
              disabled={!origin}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                copyState === "copied"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                  : "bg-emerald-600 text-white shadow-md shadow-emerald-700/25 hover:bg-emerald-700"
              }`}
            >
              {copyState === "copied" ? (
                <>
                  <Check className="size-4" strokeWidth={3} />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy NFC Link
                </>
              )}
            </button>
            <Link
              href={scanPath(tag.id)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-stone-700 ring-1 ring-inset ring-stone-200 transition-all duration-200 hover:bg-stone-50 active:scale-[0.98]"
            >
              <ExternalLink className="size-4" />
              Open link
            </Link>
          </div>
          {copyState === "failed" && (
            <ActionError message="Couldn't copy automatically. The link is selected, so copy it by hand." />
          )}

          {origin && isLocalOnlyOrigin(origin) && (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800 ring-1 ring-amber-200/80">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              This is a local test link. It only works on this computer. A
              physical tag will need the app&apos;s public HTTPS address once
              it&apos;s deployed.
            </p>
          )}

          {/* 6. Remove */}
          <button
            type="button"
            onClick={onRequestRemove}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 className="size-4" />
            Remove tag
          </button>
        </div>
      )}
    </SettingsSection>
  );
}

function ActionError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-3 flex items-start gap-1.5 text-sm text-rose-600"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
