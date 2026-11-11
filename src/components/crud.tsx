import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/associada-form";
import { errMsg } from "@/lib/elite";

export type FieldDef = { k: string; l: string; type?: "text" | "number" | "textarea" | "bool" | "select"; options?: [string, string][] };

export function CrudDialog({ table, fields, initial, trigger, title }: { table: "beneficios" | "parceiros"; fields: FieldDef[]; initial: Record<string, unknown>; trigger: React.ReactNode; title: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Record<string, unknown>>(initial);
  const qc = useQueryClient();
  async function save() {
    const p: Record<string, unknown> = { ...f };
    delete p["created_at"];
    for (const d of fields) { if (p[d.k] === "") p[d.k] = null; if (d.type === "number" && p[d.k] != null) p[d.k] = Number(p[d.k]); }
    setBusy(true);
    const { error } = p["id"] ? await supabase.from(table).update(p as never).eq("id", p["id"] as string) : await supabase.from(table).insert(p as never);
    setBusy(false);
    if (error) return void toast.error(errMsg(error));
    toast.success("Salvo.");
    qc.invalidateQueries();
    setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setF(initial); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader><DialogTitle className="font-display text-3xl font-medium">{title}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          {fields.map((d) => (
            <Field key={d.k} label={d.l}>
              {d.type === "textarea" ? <Textarea rows={3} value={(f[d.k] as string) ?? ""} onChange={(e) => setF({ ...f, [d.k]: e.target.value })} />
                : d.type === "bool" ? <div><Switch checked={!!f[d.k]} onCheckedChange={(v) => setF({ ...f, [d.k]: v })} /></div>
                : d.type === "select" ? (
                  <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={(f[d.k] as string) ?? ""} onChange={(e) => setF({ ...f, [d.k]: e.target.value })}>
                    {d.options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : <Input type={d.type ?? "text"} value={(f[d.k] as string) ?? ""} onChange={(e) => setF({ ...f, [d.k]: e.target.value })} />}
            </Field>
          ))}
        </div>
        <Button onClick={save} disabled={busy} className="sticky bottom-0 w-full shadow-soft">{busy ? "Salvando…" : "Salvar"}</Button>
      </DialogContent>
    </Dialog>
  );
}
