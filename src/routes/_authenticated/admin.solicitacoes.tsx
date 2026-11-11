import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel, StatusBadge, EmptyState } from "@/components/brand";
import { errMsg, fmtDate, podeUsar, useTable } from "@/lib/elite";

export const Route = createFileRoute("/_authenticated/admin/solicitacoes")({
  head: () => ({ meta: [
    { title: "Solicitações — Elite Club" },
    { name: "description", content: "Solicitações de benefícios das associadas Elite Club." },
    { property: "og:title", content: "Solicitações — Elite Club" },
    { property: "og:description", content: "Solicitações de benefícios das associadas Elite Club." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Solic,
});

function Solic() {
  const { data: usos = [] } = useTable("usos", "created_at", false);
  const { data: assoc = [] } = useTable("associadas", "nome_completo");
  const { data: bens = [] } = useTable("beneficios", "ordem");
  const qc = useQueryClient();
  const pend = usos.filter((u) => u.status === "pendente");
  const recentes = usos.filter((u) => u.origem === "associada" && u.status !== "pendente").slice(0, 10);

  async function decidir(id: string, status: "confirmado" | "recusado") {
    let justificativa: string | null = null;
    let { error } = await supabase.from("usos").update({ status }).eq("id", id);
    if (error && status === "confirmado") {
      justificativa = prompt(`${errMsg(error)}\n\nPara aprovar como exceção, informe a justificativa:`);
      if (!justificativa?.trim()) return;
      ({ error } = await supabase.from("usos").update({ status, excecao: true, justificativa }).eq("id", id));
    }
    if (error) return void toast.error(errMsg(error));
    toast.success(status === "confirmado" ? "Solicitação aprovada." : "Solicitação recusada.");
    qc.invalidateQueries();
  }

  const card = (u: (typeof usos)[number], actions: boolean) => {
    const a = assoc.find((x) => x.id === u.associada_id);
    const b = bens.find((x) => x.id === u.beneficio_id);
    const elig = a ? podeUsar(a, u.data) : { ok: true, motivo: "" };
    return (
      <Panel key={u.id} className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="font-display text-xl">{b?.titulo}</p>
            <p className="text-sm">{a?.nome_completo}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {fmtDate(u.data)} {u.horario?.slice(0, 5)} · {Number(u.quantidade)} {b?.unidade}
              {u.convidada_nome && ` · Convidada: ${u.convidada_nome} (${u.convidada_whatsapp ?? u.convidada_email ?? ""})`}
            </p>
            {u.observacoes && <p className="mt-1 text-xs italic text-muted-foreground">"{u.observacoes}"</p>}
            {!elig.ok && <p className="mt-1 text-xs text-destructive">{elig.motivo}</p>}
            {b?.tipo === "endereco_fiscal" && a && !a.cnpj && <p className="mt-1 text-xs text-destructive">Associada sem CNPJ.</p>}
          </div>
          {actions ? (
            <div className="flex gap-2 sm:flex-col">
              <Button size="sm" onClick={() => decidir(u.id, "confirmado")}><Check /> Aprovar</Button>
              <Button size="sm" variant="outline" onClick={() => decidir(u.id, "recusado")}><X /> Recusar</Button>
            </div>
          ) : <div className="self-start"><StatusBadge value={u.status} /></div>}
        </div>
      </Panel>
    );
  };

  return (
    <>
      <PageTitle eyebrow={`${pend.length} pendentes`} title="Solicitações" />
      <div className="grid gap-3">{pend.map((u) => card(u, true))}</div>
      {pend.length === 0 && <EmptyState icon={Inbox} text="Nenhuma solicitação pendente." />}
      {recentes.length > 0 && (
        <>
          <p className="eyebrow mb-3 mt-10 text-primary">Decididas recentemente</p>
          <div className="grid gap-3">{recentes.map((u) => card(u, false))}</div>
        </>
      )}
    </>
  );
}
