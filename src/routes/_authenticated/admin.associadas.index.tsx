import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Plus, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTitle, Panel, StatusBadge, EmptyState, PageSkeleton } from "@/components/brand";
import { SITUACOES, downloadCSV, fmtDate, useTable } from "@/lib/elite";

export const Route = createFileRoute("/_authenticated/admin/associadas/")({
  head: () => ({ meta: [{ title: "Associadas — Elite Club" }, { name: "description", content: "Cadastros das associadas Elite Club." }] }),
  component: Lista,
});

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Lista() {
  const { data = [], isLoading } = useTable("associadas", "nome_completo");
  const [q, setQ] = useState("");
  const [sit, setSit] = useState("");
  const list = data.filter(
    (a) => (!sit || a.situacao === sit) && norm([a.nome_completo, a.nome_exibicao, a.empresa, a.email, a.cidade, a.segmento].join(" ")).includes(norm(q)),
  );

  function exportar() {
    downloadCSV("associadas.csv", [
      ["Nome", "Exibição", "E-mail", "WhatsApp", "Empresa", "Cargo", "Segmento", "CNPJ", "Cidade", "UF", "Plano", "Início", "Fim", "Vencimento", "Situação", "Página", "Acesso criado"],
      ...list.map((a) => [a.nome_completo, a.nome_exibicao, a.email, a.whatsapp, a.empresa, a.cargo, a.segmento, a.cnpj, a.cidade, a.uf, a.plano, a.vigencia_inicio, a.vigencia_fim, a.dia_vencimento, a.situacao, a.slug ? `${location.origin}/m/${a.slug}` : "", a.user_id ? "sim" : "não"]),
    ]);
  }

  if (isLoading) return <PageSkeleton />;
  return (
    <>
      <PageTitle eyebrow={`${data.length} cadastradas`} title="Associadas">
        <Button variant="outline" size="sm" onClick={exportar}><Download /> CSV</Button>
        <Button size="sm" asChild><Link to="/admin/associadas/$id/editar" params={{ id: "nova" }}><Plus /> Nova</Link></Button>
      </PageTitle>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, empresa, e-mail, segmento…" className="h-10 bg-card pl-9" />
        </div>
        <select value={sit} onChange={(e) => setSit(e.target.value)} className="h-10 rounded-md border bg-card px-3 text-sm">
          <option value="">Todas as situações</option>
          {SITUACOES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="grouped-list">
        {list.map((a) => (
          <Link key={a.id} to="/admin/associadas/$id" params={{ id: a.id }}>
            <Panel className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 p-4 transition-colors hover:border-primary sm:p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary-hover">
                {a.foto_url ? <img src={a.foto_url} alt={a.nome_completo} loading="lazy" className="h-full w-full object-cover" /> : a.nome_completo.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{a.nome_exibicao ?? a.nome_completo}</p>
                <p className="truncate text-xs text-muted-foreground">{[a.cargo, a.empresa].filter(Boolean).join(" · ")} {a.vigencia_fim && `· até ${fmtDate(a.vigencia_fim)}`}{!a.user_id && " · sem acesso criado"}</p>
              </div>
              <StatusBadge value={a.situacao} /><ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Panel>
          </Link>
        ))}
        {list.length === 0 && <EmptyState text="Nenhuma associada encontrada.">{data.length === 0 && <Button asChild><Link to="/admin/associadas/$id/editar" params={{ id: "nova" }}><Plus /> Cadastrar primeira associada</Link></Button>}</EmptyState>}
      </div>
    </>
  );
}
