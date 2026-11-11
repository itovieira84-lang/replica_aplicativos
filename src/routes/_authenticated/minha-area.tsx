import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, MessageCircle, Mail, Instagram, Globe, Gift, CalendarDays, Handshake, Clock3, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { hasPartnerContact } from "@/lib/partner-contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DialogSeal, PageTitle, Panel, StatusBadge, PageSkeleton } from "@/components/brand";
import { AssociadaForm, Field } from "@/components/associada-form";
import { CONDICOES_GERAIS, errMsg, fmtDate, monthKey, podeUsar, socialUrl, todayISO, usadoNoMes, useMe, useTable, waLink, type Beneficio } from "@/lib/elite";

export const Route = createFileRoute("/_authenticated/minha-area")({
  head: () => ({
    meta: [
      { title: "Minha área — Elite Club" },
      { name: "description", content: "Benefícios, encontros e página pessoal da associada Elite Club." },
      { property: "og:title", content: "Minha área — Elite Club" },
      { property: "og:description", content: "Benefícios, encontros e página pessoal da associada Elite Club." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MinhaArea,
});

const TABS = ["Benefícios", "Encontros", "Parceiros", "Histórico", "Minha página"] as const;

function MinhaArea() {
  const { data: me, isLoading } = useMe();
  const { data: bens = [] } = useTable("beneficios", "ordem");
  const { data: usos = [] } = useTable("usos", "data", false);
  const { data: encontros = [] } = useTable("encontros", "data");
  const { data: parceiros = [] } = useTable("parceiros", "nome");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Benefícios");
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const a = me?.associada;
  const ym = monthKey(todayISO());

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between glass px-5 py-3 sm:px-8">
        <div className="rounded-xl bg-ink px-3 py-2"><img src="/brand/elite-horizontal-light.png" alt="Elite Club" className="h-7" /></div>
        <Button variant="ghost" onClick={signOut} className="text-sm text-muted-foreground"><LogOut className="h-4 w-4" /> Sair</Button>
      </header>
      <main className="mx-auto max-w-5xl px-5 pt-6 pb-32 sm:px-8">
        {isLoading ? <PageSkeleton /> : !a ? (
          <Panel><p>Seu acesso ainda não está vinculado a um cadastro de associada. Fale com a administração do Elite Club.</p></Panel>
        ) : (
          <>
            <PageTitle eyebrow="Bem-vinda" title={a.nome_exibicao ?? a.nome_completo}><StatusBadge value={a.situacao} /></PageTitle>
            <div className="glass fixed bottom-4 left-3 right-3 z-40 grid grid-cols-5 gap-1 rounded-3xl p-2 sm:static sm:mb-7 sm:flex sm:w-fit sm:rounded-2xl">
              {TABS.map((t, i) => { const Icon = [Gift, CalendarDays, Handshake, Clock3, UserRound][i] ?? Gift; return (
                <Button key={t} size="sm" variant="ghost" onClick={() => setTab(t)} aria-pressed={tab === t} className={`h-14 flex-col gap-1 px-1 text-[9px] sm:h-11 sm:flex-row sm:px-4 sm:text-xs ${tab === t ? "bg-primary/10 text-primary-hover" : "text-muted-foreground"}`}><Icon className="h-5 w-5" />{t}</Button>
              ); })}
            </div>

            {tab === "Benefícios" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {!podeUsar(a).ok && <Panel className="sm:col-span-2 border-destructive/40"><p className="text-sm text-destructive">Benefícios indisponíveis: {podeUsar(a).motivo}</p></Panel>}
                {bens.filter((b) => b.ativo).map((b) => {
                  const u = usadoNoMes(usos, a.id, b.id, ym);
                  const lim = b.limite_mensal != null ? Number(b.limite_mensal) : null;
                  return (
                    <Panel key={b.id}>
                      <p className="font-display text-xl">{b.titulo}</p>
                      {b.descricao && <p className="mt-1 text-sm text-muted-foreground">{b.descricao}</p>}
                      <div className="mt-4 text-sm">{lim != null ? `${u} de ${lim} ${b.unidade} usados este mês` : "Sem limite mensal"}</div>
                      {lim != null && <Progress value={Math.min(100, (u / lim) * 100)} className="mt-3 h-2.5" />}
                      {b.pode_solicitar && podeUsar(a).ok && <div className="mt-4"><Solicitar b={b} associadaId={a.id} /></div>}
                    </Panel>
                  );
                })}
                <p className="text-xs text-muted-foreground sm:col-span-2">{CONDICOES_GERAIS}</p>
              </div>
            )}

            {tab === "Encontros" && (
              <div className="space-y-4">
                {encontros.filter((e) => e.data >= todayISO()).map((e) => (
                  <Panel key={e.id}>
                    <p className="eyebrow text-primary">{fmtDate(e.data)} {e.inicio?.slice(0, 5)}{e.fim ? `–${e.fim.slice(0, 5)}` : ""}</p>
                    <p className="mt-1 font-display text-xl">{e.titulo}</p>
                    {e.local && <p className="text-sm text-muted-foreground">{e.local}</p>}
                    {e.programacao?.length ? <ul className="mt-3 list-disc pl-5 text-sm">{e.programacao.map((p) => <li key={p}>{p}</li>)}</ul> : null}
                  </Panel>
                ))}
                {encontros.every((e) => e.data < todayISO()) && <p className="text-muted-foreground">Nenhum encontro agendado.</p>}
              </div>
            )}

            {tab === "Parceiros" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {parceiros.filter((p) => p.ativo).map((p) => (
                  <Panel key={p.id}>
                    <div className="mb-4 flex items-center gap-3"><img src={p.logo_url || "/brand/elite-mark.png"} alt="" className="h-12 w-12 rounded-2xl bg-secondary object-contain p-2" /><p className="font-display text-xl font-semibold">{p.nome}</p></div>
                    <p className="text-xs text-muted-foreground">{[p.categoria, p.ecossistema].filter(Boolean).join(" · ")}</p>
                    {p.descricao && <p className="mt-2 text-sm">{p.descricao}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hasPartnerContact(p.whatsapp) && <Button size="sm" variant="outline" asChild><a href={waLink(p.whatsapp, "Olá! Sou associada do Elite Club.")} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>}
                      {hasPartnerContact(p.email) && <Button size="sm" variant="outline" asChild><a href={`mailto:${p.email}`}><Mail /> E-mail</a></Button>}
                      {hasPartnerContact(p.instagram) && <Button size="sm" variant="outline" asChild><a href={socialUrl("instagram", p.instagram)} target="_blank" rel="noreferrer"><Instagram /> Instagram</a></Button>}
                      {hasPartnerContact(p.site) && <Button size="sm" variant="outline" asChild><a href={socialUrl("site", p.site)} target="_blank" rel="noreferrer"><Globe /> Site</a></Button>}
                    </div>
                  </Panel>
                ))}
              </div>
            )}

            {tab === "Histórico" && (
              <Panel>
                <ul className="divide-y text-sm">
                  {usos.filter((u) => u.associada_id === a.id).map((u) => (
                    <li key={u.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate">{bens.find((b) => b.id === u.beneficio_id)?.titulo}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(u.data)} · {Number(u.quantidade)}{u.convidada_nome ? ` · ${u.convidada_nome}` : ""}</p>
                      </div>
                      <div className="self-start"><StatusBadge value={u.status} /></div>
                    </li>
                  ))}
                  {!usos.some((u) => u.associada_id === a.id) && <li className="py-3 text-muted-foreground">Sem registros.</li>}
                </ul>
              </Panel>
            )}

            {tab === "Minha página" && (
              <AssociadaForm initial={a} admin={false} onSaved={() => qc.invalidateQueries({ queryKey: ["me"] })} />
            )}
          </>
        )}
        <DialogSeal dark={false} className="mt-12" />
      </main>
    </div>
  );
}

function Solicitar({ b, associadaId }: { b: Beneficio; associadaId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ data: todayISO(), horario: "", quantidade: "1", observacoes: "", convidada_nome: "", convidada_whatsapp: "", convidada_email: "" });
  const qc = useQueryClient();
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const conv = b.tipo === "convidada";
  const reserva = !!b.exige_reserva;

  async function send() {
    if (conv && !f.convidada_nome.trim()) return void toast.error("Informe o nome da convidada.");
    if (reserva && !f.horario) return void toast.error("Escolha o horário da reserva.");
    if (f.data < todayISO()) return void toast.error("Escolha uma data a partir de hoje.");
    const qtd = reserva ? Math.max(1, Number(f.quantidade) || 1) : 1;
    setBusy(true);
    const { error } = await supabase.from("usos").insert({
      associada_id: associadaId, beneficio_id: b.id, data: f.data, horario: f.horario || null, quantidade: qtd,
      status: "pendente", origem: "associada", observacoes: f.observacoes || null,
      convidada_nome: f.convidada_nome || null, convidada_whatsapp: f.convidada_whatsapp || null, convidada_email: f.convidada_email || null,
    });
    setBusy(false);
    if (error) return void toast.error(errMsg(error));
    toast.success("Solicitação enviada! Aguarde a confirmação.");
    qc.invalidateQueries({ queryKey: ["usos"] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm">Solicitar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{b.titulo}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data"><Input type="date" min={todayISO()} value={f.data} onChange={(e) => set("data", e.target.value)} /></Field>
          <Field label={reserva ? "Horário de início" : "Horário"}><Input type="time" required={reserva} value={f.horario} onChange={(e) => set("horario", e.target.value)} /></Field>
          {reserva && <Field label={`Duração (${b.unidade || "horas"})`}><Input type="number" min={1} step={1} value={f.quantidade} onChange={(e) => set("quantidade", e.target.value)} /></Field>}
          {conv && <>
            <Field label="Nome da convidada"><Input value={f.convidada_nome} onChange={(e) => set("convidada_nome", e.target.value)} /></Field>
            <Field label="WhatsApp da convidada"><Input inputMode="tel" value={f.convidada_whatsapp} onChange={(e) => set("convidada_whatsapp", e.target.value)} /></Field>
            <Field label="E-mail da convidada" className="sm:col-span-2"><Input type="email" value={f.convidada_email} onChange={(e) => set("convidada_email", e.target.value)} /></Field>
          </>}
          <Field label="Observações" className="sm:col-span-2"><Textarea value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></Field>
        </div>
        {reserva && <p className="text-xs text-muted-foreground">Se o horário já estiver reservado, avisaremos na hora para você escolher outro.</p>}
        <Button onClick={send} disabled={busy}>{busy ? "Enviando…" : "Enviar solicitação"}</Button>
      </DialogContent>
    </Dialog>
  );
}
