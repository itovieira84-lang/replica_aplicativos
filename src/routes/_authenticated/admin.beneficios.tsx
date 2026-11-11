import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel } from "@/components/brand";
import { CrudDialog, type FieldDef } from "@/components/crud";
import { CONDICOES_GERAIS, TIPOS, TIPO_LABEL, useTable } from "@/lib/elite";

export const Route = createFileRoute("/_authenticated/admin/beneficios")({
  head: () => ({ meta: [
    { title: "Benefícios — Elite Club" },
    { name: "description", content: "Benefícios e parceiros do Elite Club." },
    { property: "og:title", content: "Benefícios — Elite Club" },
    { property: "og:description", content: "Benefícios e parceiros do Elite Club." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Beneficios,
});

function Beneficios() {
  const { data: bens = [] } = useTable("beneficios", "ordem");
  const { data: parc = [] } = useTable("parceiros", "nome");
  const fields: FieldDef[] = [
    { k: "titulo", l: "Título" }, { k: "descricao", l: "Descrição", type: "textarea" },
    { k: "tipo", l: "Tipo", type: "select", options: TIPOS.map((t) => [t, TIPO_LABEL[t] ?? t]) },
    { k: "parceiro_id", l: "Parceiro que fornece", type: "select", options: [["", "— Elite Club —"], ...parc.map((p) => [p.id, p.nome] as [string, string])] },
    { k: "desconto_pct", l: "% de desconto", type: "number" }, { k: "limite_mensal", l: "Limite mensal (vazio = sem limite)", type: "number" },
    { k: "unidade", l: "Unidade", type: "select", options: [["vezes", "vezes"], ["horas", "horas"]] },
    { k: "exige_reserva", l: "Exige reserva", type: "bool" }, { k: "pode_solicitar", l: "Associada pode solicitar", type: "bool" },
    { k: "regras", l: "Regras", type: "textarea" }, { k: "clausula", l: "Cláusula do contrato" }, { k: "ativo", l: "Ativo", type: "bool" },
  ];
  return (
    <>
      <PageTitle eyebrow="Contrato" title="Benefícios">
        <CrudDialog table="beneficios" title="Novo benefício" fields={fields} initial={{ tipo: "experiencia", unidade: "vezes", ativo: true, parceiro_id: "" }} trigger={<Button size="sm"><Plus /> Novo</Button>} />
      </PageTitle>
      <p className="mb-6 text-sm italic text-muted-foreground">{CONDICOES_GERAIS}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {bens.map((b) => (
          <CrudDialog key={b.id} table="beneficios" title="Editar benefício" fields={fields} initial={{ ...b, parceiro_id: b.parceiro_id ?? "" }} trigger={
            <Button variant="ghost" className="h-auto w-full whitespace-normal p-0 text-left font-normal hover:bg-transparent">
              <Panel className={`h-full transition-colors hover:border-primary ${b.ativo ? "" : "opacity-50"}`}>
                <p className="eyebrow text-[0.58rem] text-primary">{b.clausula && `Cláusula ${b.clausula} · `}{TIPO_LABEL[b.tipo]}</p>
                <p className="mt-1 font-display text-2xl">{b.titulo}{b.desconto_pct ? ` — ${b.desconto_pct}% off` : ""}</p>
                <p className="mt-1 text-sm text-muted-foreground">{b.descricao}</p>
                <p className="mt-3 text-xs">{b.limite_mensal != null ? `Limite: ${Number(b.limite_mensal)} ${b.unidade}/mês` : "Sem limite"} · {parc.find((p) => p.id === b.parceiro_id)?.nome ?? "Elite Club"}</p>
              </Panel>
            </Button>
          } />
        ))}
      </div>
    </>
  );
}
