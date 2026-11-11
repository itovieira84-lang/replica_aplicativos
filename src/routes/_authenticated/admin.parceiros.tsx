import { createFileRoute } from "@tanstack/react-router";
import { Plus, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel } from "@/components/brand";
import { CrudDialog, type FieldDef } from "@/components/crud";
import { hasPartnerContacts } from "@/lib/partner-contacts";
import { useTable } from "@/lib/elite";

export const Route = createFileRoute("/_authenticated/admin/parceiros")({
  head: () => ({ meta: [
    { title: "Parceiros — Elite Club" },
    { name: "description", content: "Rede de parceiros do Elite Club." },
    { property: "og:title", content: "Parceiros — Elite Club" },
    { property: "og:description", content: "Rede de parceiros do Elite Club." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Parceiros,
});

const fields: FieldDef[] = [
  { k: "nome", l: "Nome" }, { k: "logo_url", l: "URL do logo" }, { k: "categoria", l: "Categoria" }, { k: "descricao", l: "Descrição", type: "textarea" },
  { k: "ecossistema", l: "Ecossistema", type: "select", options: [["dialog", "Dialog"], ["externo", "Externo"]] },
  { k: "responsavel", l: "Responsável" }, { k: "whatsapp", l: "WhatsApp" }, { k: "email", l: "E-mail" }, { k: "site", l: "Site" }, { k: "instagram", l: "Instagram" },
  { k: "ativo", l: "Ativo", type: "bool" },
];

function Parceiros() {
  const { data: parc = [] } = useTable("parceiros", "nome");
  const { data: bens = [] } = useTable("beneficios", "ordem");
  return (
    <>
      <PageTitle eyebrow="Rede" title="Parceiros">
        <CrudDialog table="parceiros" title="Novo parceiro" fields={fields} initial={{ ecossistema: "externo", ativo: true }} trigger={<Button size="sm"><Plus /> Novo</Button>} />
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {parc.map((p) => (
          <CrudDialog key={p.id} table="parceiros" title="Editar parceiro" fields={fields} initial={p} trigger={
            <Button variant="ghost" className="h-auto w-full whitespace-normal p-0 text-left font-normal hover:bg-transparent">
              <Panel className="flex h-full gap-4 transition-colors hover:border-primary">
                <img src={p.logo_url || "/brand/elite-mark.png"} alt="" className={`h-14 w-14 shrink-0 rounded-xl object-contain ${p.ecossistema === "dialog" ? "bg-dialog-navy" : "bg-secondary"}`} />
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-[0.58rem] text-primary">{p.ecossistema === "dialog" ? "Ecossistema Dialog" : "Externo"} · {p.categoria}</p>
                  <p className="font-display text-2xl">{p.nome}</p>
                  {!hasPartnerContacts(p) && <p className="mt-2 flex items-center gap-1.5 text-xs font-normal text-muted-foreground"><Pencil className="h-3 w-3" />Contatos não cadastrados<ChevronRight className="h-3 w-3" /></p>}
                  <p className="mt-2 text-xs text-muted-foreground">{bens.filter((b) => b.parceiro_id === p.id).map((b) => b.titulo).join(" · ") || "Sem benefícios vinculados"}</p>
                </div>
              </Panel>
            </Button>
          } />
        ))}
      </div>
    </>
  );
}
