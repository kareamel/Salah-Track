"use client";

import { useEffect, useRef, useState } from "react";
import type { Toast } from "@/components/salahtrack/toast";
import type { LoadStatus } from "@/components/salahtrack/ui";
import {
  addPrayerRecord,
  deletePrayerRecord,
  fetchPrayerRecords,
  PrayerRecordError,
  type PrayerRecord,
  type PrayerRecordErrorKind,
} from "@/lib/prayer-records";
import { PRAYERS, type Prayer, type PrayerName } from "@/lib/prayers";

export type RecordsByPrayer = Partial<Record<PrayerName, PrayerRecord>>;
export type PendingAction = { prayer: Prayer; action: "complete" | "undo" };

/** The outcome of a one-tap save (see `recordPrayer`). */
export type RecordResult =
  | { ok: true; prayer: PrayerName }
  | { ok: false; kind: PrayerRecordErrorKind; message: string };

export function messageFor(error: unknown) {
  return error instanceof PrayerRecordError
    ? error.message
    : "Something went wrong. Please try again.";
}

/**
 * Today's prayer checklist: loads the user's records for `prayerDate` (their
 * local "YYYY-MM-DD"), and saves or removes records only after the user
 * confirms in a dialog. Shared by the dashboard and the NFC check-in page so
 * both use exactly the same saving logic.
 *
 * Pass `allowUndo: false` to only allow recording incomplete prayers.
 */
export function useTodayPrayers(
  prayerDate: string | null,
  { allowUndo = true }: { allowUndo?: boolean } = {},
) {
  // Today's saved records from Supabase, keyed by prayer name.
  const [records, setRecords] = useState<RecordsByPrayer>({});
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // The confirmation dialog, and whether it is currently saving.
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [toast, setToast] = useState<Toast | null>(null);
  // The most recently recorded prayer (for a success message).
  const [lastRecorded, setLastRecorded] = useState<PrayerName | null>(null);

  // One-tap saving (NFC check-in): which prayer is being saved right now.
  // The ref blocks a second save from a fast double-tap before React
  // has re-rendered.
  const [recordingPrayer, setRecordingPrayer] = useState<PrayerName | null>(
    null,
  );
  const savingRef = useRef(false);

  // Load today's records whenever the date changes (or "Try again" is pressed).
  useEffect(() => {
    if (!prayerDate) return;
    let cancelled = false;
    setStatus("loading");
    setLoadError(null);

    fetchPrayerRecords(prayerDate)
      .then((rows) => {
        if (cancelled) return;
        setRecords(Object.fromEntries(rows.map((r) => [r.prayer_name, r])));
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(messageFor(error));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [prayerDate, reloadKey]);

  // Hide messages automatically after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(null),
      toast.tone === "error" ? 5000 : 2500,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const completedCount = PRAYERS.filter((p) => records[p.name]).length;

  function reload() {
    setReloadKey((k) => k + 1);
  }

  // Inserts today's record. The screen only changes after Supabase confirms.
  async function saveRecord(prayer: Prayer) {
    if (!prayerDate) {
      throw new PrayerRecordError(
        "unknown",
        "Today's date isn't ready yet. Please try again.",
      );
    }
    const saved = await addPrayerRecord(prayerDate, prayer.name);
    setRecords((prev) => ({ ...prev, [saved.prayer_name]: saved }));
    setLastRecorded(saved.prayer_name);
    return saved;
  }

  /**
   * Records `prayer` straight away, without a dialog. Used where the
   * button press itself is the explicit confirmation ("Yes, I prayed").
   * Never saves a prayer that's already recorded today.
   */
  async function recordPrayer(prayer: Prayer): Promise<RecordResult> {
    if (savingRef.current) {
      return {
        ok: false,
        kind: "unknown",
        message: "Already saving. Please wait.",
      };
    }
    if (status !== "ready") {
      return {
        ok: false,
        kind: "unknown",
        message: "Still loading today's prayers. Please try again.",
      };
    }
    if (records[prayer.name]) {
      // Never send a duplicate: the screen already knows it's recorded.
      return {
        ok: false,
        kind: "duplicate",
        message: `${prayer.name} is already recorded for today.`,
      };
    }

    savingRef.current = true;
    setRecordingPrayer(prayer.name);
    try {
      await saveRecord(prayer);
      return { ok: true, prayer: prayer.name };
    } catch (error: unknown) {
      const kind = error instanceof PrayerRecordError ? error.kind : "unknown";
      // Already saved elsewhere (another tab or a second tap of the tag):
      // reload so the screen shows the real state.
      if (kind === "duplicate") reload();
      return { ok: false, kind, message: messageFor(error) };
    } finally {
      savingRef.current = false;
      setRecordingPrayer(null);
    }
  }

  function openDialog(prayer: Prayer) {
    if (status !== "ready") return;
    const done = Boolean(records[prayer.name]);
    if (done && !allowUndo) return;
    setDialogError(null);
    setPending({ prayer, action: done ? "undo" : "complete" });
  }

  function closeDialog() {
    if (saving) return;
    setPending(null);
    setDialogError(null);
  }

  // Runs only after the user confirms in the dialog.
  async function confirmPending() {
    if (!pending || !prayerDate) return;
    const { prayer, action } = pending;
    setSaving(true);
    setDialogError(null);

    try {
      if (action === "complete") {
        // The screen updates only after the database confirms the save.
        await saveRecord(prayer);
        setToast({
          tone: "success",
          message: `${prayer.name} recorded. May Allah accept it.`,
        });
      } else {
        const existing = records[prayer.name];
        if (existing) await deletePrayerRecord(existing.id);
        setRecords((prev) => {
          const next = { ...prev };
          delete next[prayer.name];
          return next;
        });
        setLastRecorded(null);
        setToast({ tone: "success", message: `${prayer.name} record removed.` });
      }
      setPending(null);
    } catch (error: unknown) {
      const kind = error instanceof PrayerRecordError ? error.kind : "unknown";
      if (kind === "duplicate" || kind === "not-found") {
        // The screen was out of date (e.g. changed in another tab). Close the
        // dialog and reload the real state from the database.
        setPending(null);
        reload();
        setToast({ tone: "error", message: messageFor(error) });
      } else {
        // Keep the dialog open so the user can try again.
        setDialogError(messageFor(error));
      }
    } finally {
      setSaving(false);
    }
  }

  return {
    records,
    status,
    loadError,
    reload,
    completedCount,
    pending,
    saving,
    dialogError,
    openDialog,
    closeDialog,
    confirmPending,
    toast,
    lastRecorded,
    recordPrayer,
    recordingPrayer,
  };
}
