import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTitle, Panel } from "@/components/brand";
import { UsoDialog } from "@/components/uso-dialog";
import { errMsg, fmtDate, fmtMonth, monthKey, podeUsar, shiftMonth, todayISO, useTable } from "@/lib/elite";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/encontros")({
  head: () => ({ meta: [
    { title: "Encontros — Elite Club" },
    { name: "description", content: "Agenda e presenças nos encontros Elite Club." },
    { property: "og:title", content: "Encontros — Elite Club" },
    { property: "og:description", content: "Agenda e presenças nos encontros Elite Club." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Encontros,
});

function Encontros() {
  const { data: encontros = [] } = useTable("encontros", "data");
  const { data: assoc = [] } = useTable("associadas", "nome_completo");
  const { data: bens = [] } = useTable("beneficios", "ordem");
  const { data: usos = [] } = useTable("usos", "data");
  const qc = useQueryClient();
  const [ym, setYm] = useState(monthKey(todayISO()));
  const [selId, setSelId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState("");
  const benEnc = bens.find((b) => b.codigo === "encontro");
  const benConv = bens.find((b) => b.codigo === "convidada");
  const doMes = encontros.filter((e) => e.data.startsWith(ym));
  const sel = encontros.find((e) => e.id === selId) ?? doMes[0];

  const first = new Date(ym + "-01T12:00:00");
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const offset = first.getDay();

  async function checkin(aid: string, presente: boolean) {
    if (!sel || !benEnc) return;
    const exist = usos.find((u) => u.encontro_id === sel.id && u.associada_id === aid && u.beneficio_id === benEnc.id && u.status !== "cancelado");
    let error;
    if (presente) {
      if (exist) return;
      ({ error } = await supabase.from("usos").insert({ associada_id: aid, beneficio_id: benEnc.id, data: sel.data, horario: sel.inicio, encontro_id: sel.id, status: "confirmado", origem: "admin", observacoes: "Check-in de presença" }));
      if (error) {
        const j = prompt(`${errMsg(error)}\n\nJustificativa para registrar como exceção:`);
        if (!j?.trim()) return;
        ({ error } = await supabase.from("usos").insert({ associada_id: aid, beneficio_id: benEnc.id, data: sel.data, horario: sel.inicio, encontro_id: sel.id, status: "confirmado", origem: "admin", excecao: true, justificativa: j, observacoes: "Check-in de presença" }));
      }
    } else if (exist) {
      ({ error } = await supabase.from("usos").update({ status: "cancelado" }).eq("id", exist.id));
    }
    if (error) toast.error(errMsg(error));
    qc.invalidateQueries();
  }

  async function criar() {
    if (!novaData) return;
    const { error } = await supabase.from("encontros").insert({ data: novaData, titulo: `Encontro Elite — ${novaData.slice(5, 7)}/${novaData.slice(0, 4)}`, local: "Dialog — Sala Principal" });
    if (error) return void toast.error(errMsg(error));
    setNovaData("");
    qc.invalidateQueries();
  }

  const convidadas = sel ? usos.filter((u) => u.beneficio_id === benConv?.id && u.data.startsWith(sel.data.slice(0, 7)) && u.status !== "cancelado" && u.status !== "recusado") : [];

  return (
    <>
      <PageTitle eyebrow="Agenda" title="Encontros">
        <Input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="h-9 w-40 bg-card" />
        <Button size="sm" onClick={criar}><Plus /> Criar</Button>
      </PageTitle>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Panel>
          <div className="mb-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center">
            <Button variant="ghost" size="icon" onClick={() => { setYm(shiftMonth(ym, -1)); setSelId(null); }}><ChevronLeft /></Button>
            <p className="text-center font-display text-xl">{fmtMonth(ym)}</p>
            <Button variant="ghost" size="icon" onClick={() => { setYm(shiftMonth(ym, 1)); setSelId(null); }}><ChevronRight /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <span key={i} className="eyebrow py-1 text-[0.55rem] text-muted-foreground">{d}</span>)}
            {Array.from({ length: offset }).map((_, i) => <span key={"o" + i} />)}
            {Array.from({ length: days }).map((_, i) => {
              const date = `${ym}-${String(i + 1).padStart(2, "0")}`;
              const e = encontros.find((x) => x.data === date);
              return (
                <Button variant="ghost" key={date} disabled={!e} onClick={() => e && setSelId(e.id)}
                  className={cn("h-auto min-h-10 w-full aspect-square rounded-full p-0 font-display text-base", e ? "bg-primary/15 text-primary-hover hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground", sel?.id === e?.id && e && "bg-primary text-primary-foreground")}>
                  {i + 1}
                </Button>
              );
            })}
          </div>
        </Panel>

        {sel ? (
          <Panel>
            <p className="eyebrow text-primary">{fmtDate(sel.data)} · {sel.inicio?.slice(0, 5)}–{sel.fim?.slice(0, 5)}</p>
            <h2 className="mt-1 text-3xl">{sel.titulo}</h2>
            <p className="text-sm text-muted-foreground">{sel.local}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{sel.programacao?.map((p) => <span key={p} className="rounded-full border border-primary/40 px-3 py-1 text-xs">{p}</span>)}</div>
            <p className="eyebrow mb-2 mt-6 text-primary">Check-in de presença</p>
            <ul className="divide-y">
              {assoc.filter((a) => a.situacao !== "cancelada").map((a) => {
                const presente = usos.some((u) => u.encontro_id === sel.id && u.associada_id === a.id && u.beneficio_id === benEnc?.id && u.status === "confirmado");
                const el = podeUsar(a, sel.data);
                return (
                  <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <Checkbox checked={presente} onCheckedChange={(v) => checkin(a.id, !!v)} />
                    <span className="flex-1">{a.nome_completo}</span>
                    {!el.ok && <span className="text-xs text-destructive">{el.motivo}</span>}
                  </li>
                );
              })}
            </ul>
            <div className="mb-2 mt-6 flex items-center justify-between">
              <p className="eyebrow text-primary">Convidadas do mês</p>
              <UsoDialog beneficioId={benConv?.id} encontroId={sel.id} trigger={<Button variant="outline" size="sm"><UserPlus /> Convidada</Button>} />
            </div>
            <ul className="divide-y text-sm">
              {convidadas.map((u) => <li key={u.id} className="py-2">{u.convidada_nome} <span className="text-xs text-muted-foreground">· por {assoc.find((a) => a.id === u.associada_id)?.nome_completo} · {u.status}</span></li>)}
              {convidadas.length === 0 && <li className="py-2 text-muted-foreground">Nenhuma convidada.</li>}
            </ul>
          </Panel>
        ) : <Panel><p className="text-sm text-muted-foreground">Nenhum encontro neste mês.</p></Panel>}
      </div>
    </>
  );
}
