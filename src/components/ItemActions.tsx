"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

type Kind = "quran" | "hadith" | "book";

const REASONS = ["Wrong information", "Incomplete data", "Recheck it"] as const;

export function ReportDialog({
  open,
  onClose,
  itemType,
  itemRef,
}: {
  open: boolean;
  onClose: () => void;
  itemType: string;
  itemRef: string;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  useEffect(() => {
    if (open) {
      setState("idle");
      setNote("");
      setReason(REASONS[0]);
    }
  }, [open]);

  async function submit() {
    setState("saving");
    const { error } = await supabaseBrowser()
      .from("reports")
      .insert({ item_type: itemType, item_ref: itemRef, reason, note: note.trim() || null });
    setState(error ? "error" : "done");
  }

  const labels: Record<string, string> = {
    "Wrong information": t("report.wrong"),
    "Incomplete data": t("report.incomplete"),
    "Recheck it": t("report.recheck"),
  };

  return (
    <Dialog open={open} onClose={onClose} title={t("report.title")}>
      {state === "done" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">{t("report.thanks")}</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-[var(--c-brand)]"
                />
                {labels[r]}
              </label>
            ))}
          </div>
          <textarea
            className="input min-h-24"
            placeholder={t("report.note")}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
          />
          {state === "error" && <p className="text-sm text-danger">{t("common.error")}</p>}
          <button type="button" className="btn btn-primary" onClick={submit} disabled={state === "saving"}>
            {t("report.send")}
          </button>
        </div>
      )}
    </Dialog>
  );
}

export function NoteDialog({
  open,
  onClose,
  kind,
  itemRef,
  title,
}: {
  open: boolean;
  onClose: () => void;
  kind: Kind;
  itemRef: string;
  title: string;
}) {
  const { t } = useI18n();
  const [notes, setNotes] = useState<{ id: string; body: string }[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabaseBrowser()
      .from("notes")
      .select("id, body")
      .eq("kind", kind)
      .eq("ref", itemRef)
      .order("created_at", { ascending: false });
    setNotes((data as { id: string; body: string }[]) ?? []);
  }

  useEffect(() => {
    if (open) {
      setText("");
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemRef, kind]);

  async function add() {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    await supabaseBrowser().from("notes").insert({ kind, ref: itemRef, title, body });
    setText("");
    await load();
    setBusy(false);
  }

  async function remove(id: string) {
    await supabaseBrowser().from("notes").delete().eq("id", id);
    setNotes((n) => n.filter((x) => x.id !== id));
  }

  return (
    <Dialog open={open} onClose={onClose} title={`${t("note.title")} · ${title}`}>
      <div className="space-y-4">
        <textarea
          className="input min-h-24"
          placeholder={t("note.placeholder")}
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={add} disabled={busy || !text.trim()}>
          {t("note.save")}
        </button>
        {notes.length > 0 && (
          <ul className="space-y-2 border-t border-line pt-4">
            {notes.map((n) => (
              <li key={n.id} className="flex items-start gap-2 rounded-xl bg-soft p-3 text-sm">
                <span className="flex-1 whitespace-pre-wrap">{n.body}</span>
                <button type="button" className="icon-btn !h-7 !w-7" onClick={() => remove(n.id)} aria-label={t("common.delete")}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
