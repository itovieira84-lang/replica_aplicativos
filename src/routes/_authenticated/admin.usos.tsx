import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTitle, Panel, StatusBadge } from "@/components/brand";
import { UsoDialog } from "@/components/uso-dialog";
import { STATUS, downloadCSV, fmtDate, monthKey, todayISO, useTable } from "@/lib/elite";

export const Route = createFileRoute("/_authenticated/admin/usos")({
  head: () => ({ meta: [
    { title: "Uso de benefícios — Elite Club" },
    { name: "description", content: "Registros e relatórios dos benefícios Elite Club." },
    { property: "og:title", content: "Uso de benefícios — Elite Club" },
    { property: "og:description", content: "Registros e relatórios dos benefícios Elite Club." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Usos,
});

function Usos() {
  const { data: usos = [] } = useTable("usos", "data", false);
  const { data: assoc = [] } = useTable("associadas", "nome_completo");
  const { data: bens = [] } = useTable("beneficios", "ordem");
  const [ym, setYm] = useState(monthKey(todayISO()));
  const [aid, setAid] = useState("");
  const [bid, setBid] = useState("");
  const [st, setSt] = useState("");
  const list = usos.filter((u) => (!ym || u.data.startsWith(ym)) && (!aid || u.associada_id === aid) && (!bid || u.beneficio_id === bid) && (!st || u.status === st));
  const an = (id: string) => assoc.find((a) => a.id === id)?.nome_completo ?? "—";
  const bn = (id: string) => bens.find((b) => b.id === id)?.titulo ?? "—";
  const sel = "h-10 rounded-md border bg-card px-3 text-sm";
  const ativos = list.filter((u) => u.status === "confirmado" || u.status === "pendente");
  const benCols = bens.filter((b) => ativos.some((u) => u.beneficio_id === b.id));
  const assocRows = assoc.filter((a) => ativos.some((u) => u.associada_id === a.id));
  const cell = (a: string, b: string) => ativos.filter((u) => u.associada_id === a && u.beneficio_id === b).reduce((s, u) => s + Number(u.quantidade), 0);

  return (
    <>
      <PageTitle eyebrow="Controle" title="Uso de benefícios">
        <Button variant="outline" size="sm" onClick={() => downloadCSV(`usos-${ym || "todos"}.csv`, [["Data", "Horário", "Associada", "Benefício", "Qtd", "Status", "Origem", "Convidada", "Exceção", "Justificativa", "Obs."], ...list.map((u) => [u.data, u.horario, an(u.associada_id), bn(u.beneficio_id), u.quantidade, u.status, u.origem, u.convidada_nome, u.excecao ? "sim" : "", u.justificativa, u.observacoes])])}><Download /> CSV</Button>
        <UsoDialog trigger={<Button size="sm"><Plus /> Registrar</Button>} />
      </PageTitle>
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Input type="month" value={ym} onChange={(e) => setYm(e.target.value)} className="h-10 bg-card" />
        <select className={sel} value={aid} onChange={(e) => setAid(e.target.value)}><option value="">Todas as associadas</option>{assoc.map((a) => <option key={a.id} value={a.id}>{a.nome_completo}</option>)}</select>
        <select className={sel} value={bid} onChange={(e) => setBid(e.target.value)}><option value="">Todos os benefícios</option>{bens.map((b) => <option key={b.id} value={b.id}>{b.titulo}</option>)}</select>
        <select className={sel} value={st} onChange={(e) => setSt(e.target.value)}><option value="">Todos os status</option>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
      </div>

      <Panel className="mobile-data-table mb-6 overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b text-left"><th className="eyebrow p-3 text-[0.58rem]">Data</th><th className="eyebrow p-3 text-[0.58rem]">Associada</th><th className="eyebrow p-3 text-[0.58rem]">Benefício</th><th className="eyebrow p-3 text-[0.58rem]">Qtd</th><th className="eyebrow p-3 text-[0.58rem]">Status</th></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-3">{fmtDate(u.data)} {u.horario?.slice(0, 5)}</td>
                <td className="p-3">{an(u.associada_id)}</td>
                <td className="p-3">{bn(u.beneficio_id)}{u.excecao && <span className="ml-2 text-xs text-primary">exceção</span>}</td>
                <td className="p-3">{Number(u.quantidade)}</td>
                <td className="p-3"><StatusBadge value={u.status} /></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum registro.</td></tr>}
          </tbody>
        </table>
      </Panel>

      <Panel className="overflow-x-auto">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="eyebrow text-primary">Relatório associada × benefício</p>
          <Button variant="ghost" size="sm" onClick={() => downloadCSV(`relatorio-${ym}.csv`, [["Associada", ...benCols.map((b) => b.titulo)], ...assocRows.map((a) => [a.nome_completo, ...benCols.map((b) => cell(a.id, b.id))])])}><Download /> CSV</Button>
        </div>
        {benCols.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados no filtro atual.</p> : (
          <table className="hidden w-full text-sm sm:table">
            <thead><tr className="border-b"><th className="p-2 text-left">Associada</th>{benCols.map((b) => <th key={b.id} className="p-2 text-center text-xs font-medium">{b.titulo}</th>)}</tr></thead>
            <tbody>{assocRows.map((a) => <tr key={a.id} className="border-b last:border-0"><td className="p-2">{a.nome_completo}</td>{benCols.map((b) => <td key={b.id} className="p-2 text-center font-display text-lg">{cell(a.id, b.id) || "·"}</td>)}</tr>)}</tbody>
          </table>
        )}
        {benCols.length > 0 && <div className="space-y-5 sm:hidden">{assocRows.map((a) => <div key={a.id}><p className="mb-3 font-semibold">{a.nome_completo}</p><div className="space-y-2">{benCols.map((b) => <div key={b.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 text-muted-foreground">{b.titulo}</span><span className="font-semibold tabular-nums">{cell(a.id,b.id) || "·"}</span></div>)}</div></div>)}</div>}
      </Panel>
    </>
  );
}
