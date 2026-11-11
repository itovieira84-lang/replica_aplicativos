import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/associada-form";
import { STATUS, errMsg, podeUsar, todayISO, usadoNoMes, useTable } from "@/lib/elite";

export function UsoDialog({ associadaId, beneficioId, encontroId, trigger }: { associadaId?: string | undefined; beneficioId?: string | undefined; encontroId?: string | undefined; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data: assoc = [] } = useTable("associadas", "nome_completo");
  const { data: bens = [] } = useTable("beneficios", "ordem");
  const { data: usos = [] } = useTable("usos", "created_at", false);
  const qc = useQueryClient();
  const blank = { associada_id: associadaId ?? "", beneficio_id: beneficioId ?? "", data: todayISO(), horario: "", quantidade: "1", status: "confirmado", observacoes: "", convidada_nome: "", convidada_whatsapp: "", convidada_email: "", convidada_instagram: "", excecao: false, justificativa: "" };
  const [f, setF] = useState(blank);
  const [jaVeio, setJaVeio] = useState(false);
  useEffect(() => { if (open) setF(blank); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const a = assoc.find((x) => x.id === f.associada_id);
  const b = bens.find((x) => x.id === f.beneficio_id);
  const usado = a && b ? usadoNoMes(usos, a.id, b.id, f.data.slice(0, 7)) : 0;
  const avisos: string[] = [];
  if (a) { const p = podeUsar(a, f.data); if (!p.ok) avisos.push(p.motivo); }
  if (b?.limite_mensal != null && usado + Number(f.quantidade) > Number(b.limite_mensal)) avisos.push(`Limite mensal: já usado ${usado} de ${b.limite_mensal} ${b.unidade}.`);
  if (b?.tipo === "endereco_fiscal" && a && !a.cnpj) avisos.push("Associada sem CNPJ cadastrado.");
  if (b?.tipo === "convidada" && jaVeio) avisos.push("Esta convidada já participou antes (prioridade para quem nunca participou).");
  if (b?.exige_reserva && !f.horario) avisos.push("Informe o horário: este benefício exige reserva.");

  useEffect(() => {
    if (b?.tipo !== "convidada" || (!f.convidada_whatsapp && !f.convidada_email)) return setJaVeio(false);
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("convidada_ja_participou", { _whatsapp: f.convidada_whatsapp, _email: f.convidada_email });
      setJaVeio(!!data);
    }, 400);
    return () => clearTimeout(t);
  }, [f.convidada_whatsapp, f.convidada_email, b?.tipo]);

  async function save() {
    if (!f.associada_id || !f.beneficio_id) return void toast.error("Escolha associada e benefício.");
    if (b?.tipo === "convidada" && !f.convidada_nome) return void toast.error("Cadastre os dados da convidada.");
    if (b?.exige_reserva && !f.horario) return void toast.error("Informe o horário da reserva.");
    if (f.excecao && !f.justificativa.trim()) return void toast.error("Justificativa obrigatória para exceção.");
    setBusy(true);
    const { error } = await supabase.from("usos").insert({
      associada_id: f.associada_id, beneficio_id: f.beneficio_id, data: f.data, horario: f.horario || null,
      quantidade: Number(f.quantidade), status: f.status as (typeof STATUS)[number], observacoes: f.observacoes || null,
      encontro_id: encontroId ?? null, origem: "admin",
      convidada_nome: f.convidada_nome || null, convidada_whatsapp: f.convidada_whatsapp || null, convidada_email: f.convidada_email || null, convidada_instagram: f.convidada_instagram || null,
      excecao: f.excecao, justificativa: f.excecao ? f.justificativa : null,
    });
    setBusy(false);
    if (error) {
      const conflito = error.message.includes("reserva nesse horário");
      return void toast.error(conflito ? error.message : errMsg(error) + " Marque exceção com justificativa para autorizar.");
    }
    toast.success("Uso registrado.");
    qc.invalidateQueries();
    setOpen(false);
  }

  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const sel = "h-9 w-full rounded-md border bg-background px-3 text-sm";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader><DialogTitle className="font-display text-3xl font-medium">Registrar uso</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Associada" className="sm:col-span-2">
            <select className={sel} value={f.associada_id} onChange={(e) => set("associada_id", e.target.value)}>
              <option value="">Selecione…</option>
              {assoc.map((x) => <option key={x.id} value={x.id}>{x.nome_completo}</option>)}
            </select>
          </Field>
          <Field label="Benefício" className="sm:col-span-2">
            <select className={sel} value={f.beneficio_id} onChange={(e) => set("beneficio_id", e.target.value)}>
              <option value="">Selecione…</option>
              {bens.filter((x) => x.ativo).map((x) => <option key={x.id} value={x.id}>{x.titulo}</option>)}
            </select>
          </Field>
          <Field label="Data"><Input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} /></Field>
          <Field label={b?.exige_reserva ? "Horário (obrigatório)" : "Horário"}><Input type="time" value={f.horario} onChange={(e) => set("horario", e.target.value)} /></Field>
          <Field label={`Quantidade${b?.unidade === "horas" ? " (horas)" : ""}`}><Input type="number" step="0.5" min="0.5" value={f.quantidade} onChange={(e) => set("quantidade", e.target.value)} /></Field>
          <Field label="Status">
            <select className={sel} value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
          </Field>
          {b?.tipo === "convidada" && (
            <>
              <Field label="Nome da convidada"><Input value={f.convidada_nome} onChange={(e) => set("convidada_nome", e.target.value)} /></Field>
              <Field label="WhatsApp"><Input value={f.convidada_whatsapp} onChange={(e) => set("convidada_whatsapp", e.target.value)} /></Field>
              <Field label="E-mail"><Input value={f.convidada_email} onChange={(e) => set("convidada_email", e.target.value)} /></Field>
              <Field label="Instagram"><Input value={f.convidada_instagram} onChange={(e) => set("convidada_instagram", e.target.value)} /></Field>
            </>
          )}
          <Field label="Observações" className="sm:col-span-2"><Textarea rows={2} value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></Field>
        </div>
        {avisos.length > 0 && (
          <div className="space-y-1 rounded-xl border border-warning/50 bg-warning/10 p-3 text-sm">
            {avisos.map((m) => <p key={m} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary-hover" />{m}</p>)}
          </div>
        )}
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.excecao} onCheckedChange={(v) => set("excecao", !!v)} /> Autorizar como exceção</label>
        {f.excecao && <Field label="Justificativa (obrigatória)"><Textarea rows={2} value={f.justificativa} onChange={(e) => set("justificativa", e.target.value)} /></Field>}
        <Button onClick={save} disabled={busy} className="w-full">{busy ? "Registrando…" : "Registrar"}</Button>
      </DialogContent>
    </Dialog>
  );
}
