import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, CircleAlert, Ticket, Clock3, Inbox, CalendarDays } from "lucide-react";
import { PageTitle, Panel, StatusBadge, EmptyState, PageSkeleton } from "@/components/brand";
import { Progress } from "@/components/ui/progress";
import { fmtDate, fmtMonth, monthKey, todayISO, useTable } from "@/lib/elite";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Painel — Elite Club" }, { name: "description", content: "Indicadores e atividades do Elite Club." }] }),
  component: Painel,
});

function Painel() {
  const { data: assoc = [], isLoading } = useTable("associadas", "nome_completo");
  const { data: usos = [] } = useTable("usos", "created_at", false);
  const { data: bens = [] } = useTable("beneficios", "ordem");
  const { data: encontros = [] } = useTable("encontros", "data");
  const ym = monthKey(todayISO());
  const doMes = usos.filter((u) => u.data.startsWith(ym) && (u.status === "confirmado" || u.status === "pendente"));
  const sala = bens.find((b) => b.codigo === "sala");
  const horasSala = doMes.filter((u) => u.beneficio_id === sala?.id).reduce((s, u) => s + Number(u.quantidade), 0);
  const prox = encontros.find((e) => e.data >= todayISO());
  const naoAdimp = assoc.filter((a) => a.situacao !== "adimplente");
  const vencendo = assoc.filter((a) => a.situacao === "adimplente" && a.vigencia_fim && a.vigencia_fim >= todayISO() && a.vigencia_fim <= new Date(Date.now() + 30 * 86400000).toLocaleDateString("sv-SE"));
  const nome = (id: string) => assoc.find((a) => a.id === id)?.nome_exibicao ?? assoc.find((a) => a.id === id)?.nome_completo ?? "—";
  const bnome = (id: string) => bens.find((b) => b.id === id)?.titulo ?? "—";
  const porBen = bens.map((b) => ({ b, n: doMes.filter((u) => u.beneficio_id === b.id).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const dias = prox ? Math.max(0, Math.ceil((new Date(prox.data + "T12:00:00").getTime() - new Date(todayISO() + "T12:00:00").getTime()) / 86400000)) : null;
  const icons = [Users, CircleAlert, Ticket, Clock3, Inbox];
  const tones = ["bg-success/10 text-success", "bg-destructive/10 text-destructive", "bg-primary/10 text-primary-hover", "bg-dialog-navy/10 text-primary-hover", "bg-warning/10 text-warning"];
  const max = Math.max(1, ...porBen.map((x) => x.n));
  const pendentes = usos.filter((u) => u.status === "pendente").length;

  const stats = [
    ["Associadas ativas", assoc.filter((a) => a.situacao === "adimplente").length, "/admin/associadas"],
    ["Inadimplentes", assoc.filter((a) => a.situacao === "inadimplente").length, "/admin/associadas"],
    ["Usos no mês", doMes.length, "/admin/usos"],
    ["Horas de sala", `${horasSala}h`, "/admin/usos"],
    ["Pendentes", pendentes, "/admin/solicitacoes"],
  ] as const;

  if (isLoading) return <PageSkeleton />;
  return (
    <>
      <PageTitle eyebrow={fmtMonth(ym)} title="Painel" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(([l, v, to], i) => { const Icon = icons[i] ?? Ticket; return (
          <Link key={l} to={to}>
            <Panel className="h-full p-4 transition-colors hover:bg-muted sm:p-5">
              <div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-full ${tones[i]}`}><Icon className="h-5 w-5" /></div>
              <p className="font-display text-4xl font-semibold tabular-nums">{v}</p>
              <p className="mt-2 text-xs text-muted-foreground">{l}</p>
            </Panel>
          </Link>
        ); })}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel className="bg-ink-gradient text-ink-foreground lg:col-span-1">
          <div className="flex items-center justify-between"><p className="eyebrow text-primary">Próximo encontro</p><CalendarDays className="h-5 w-5 text-primary" /></div>
          {prox ? (
            <>
              <p className="mt-6 font-display text-3xl font-semibold">{fmtDate(prox.data)}</p>
              <p className="mt-3 text-sm text-ink-foreground/70">{dias === 0 ? "Hoje" : dias === 1 ? "Amanhã" : `Em ${dias} dias`}</p>
              <p className="mt-1 text-sm text-ink-foreground/70">{prox.inicio?.slice(0, 5)} – {prox.fim?.slice(0, 5)} · {prox.local}</p>
              <Link to="/admin/encontros" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">Ver check-in →</Link>
            </>
          ) : <p className="mt-3 text-sm">Nenhum agendado.</p>}
        </Panel>
        <Panel className="lg:col-span-2">
          <p className="eyebrow mb-4 text-primary">Uso por benefício no mês</p>
          {porBen.length === 0 && <EmptyState icon={Ticket} text="Nenhum uso registrado ainda." />}
          <div className="space-y-3">
            {porBen.map(({ b, n }) => (
              <div key={b.id}>
                <div className="mb-1 flex justify-between text-sm"><span>{b.titulo}</span><span className="font-display text-lg">{n}</span></div>
                <Progress value={(n / max) * 100} className="h-2.5" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="lg:col-span-2">
          <p className="eyebrow mb-4 text-primary">Atividade recente</p>
          <ul className="divide-y">
            {usos.slice(0, 8).map((u) => (
              <li key={u.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 text-sm">
                <div className="min-w-0"><p className="truncate font-medium">{nome(u.associada_id)}</p><p className="truncate text-xs text-muted-foreground">{bnome(u.beneficio_id)} · {fmtDate(u.data)}</p></div>
                <StatusBadge value={u.status} />
              </li>
            ))}
            {usos.length === 0 && <li><EmptyState icon={Clock3} text="Sem atividade." /></li>}
          </ul>
        </Panel>
        <Panel>
          <p className="eyebrow mb-4 text-primary">Atenção</p>
          <ul className="divide-y">
            {naoAdimp.map((a) => (
              <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-3 text-sm">
                <Link to="/admin/associadas/$id" params={{ id: a.id }} className="truncate hover:text-primary">{a.nome_exibicao ?? a.nome_completo}</Link>
                <StatusBadge value={a.situacao} />
              </li>
            ))}
            {vencendo.map((a) => (
              <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-3 text-sm">
                <Link to="/admin/associadas/$id" params={{ id: a.id }} className="truncate hover:text-primary">{a.nome_exibicao ?? a.nome_completo}</Link>
                <span className="text-xs text-warning">vence {fmtDate(a.vigencia_fim)}</span>
              </li>
            ))}
            {naoAdimp.length === 0 && vencendo.length === 0 && <li className="py-3 text-sm text-muted-foreground">Todas adimplentes e sem contratos vencendo em 30 dias.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
