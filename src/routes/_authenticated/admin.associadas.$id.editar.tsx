import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AssociadaForm } from "@/components/associada-form";
import { PageTitle, PageSkeleton } from "@/components/brand";

export const Route = createFileRoute("/_authenticated/admin/associadas/$id/editar")({
  head: () => ({ meta: [{ title: "Cadastro da associada — Elite Club" }, { name: "description", content: "Cadastro e edição da associada Elite Club." }] }),
  component: Editar,
});

function Editar() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["associada", id],
    enabled: id !== "nova",
    queryFn: async () => (await supabase.from("associadas").select("*").eq("id", id).single()).data,
  });
  if (id !== "nova" && isLoading) return <PageSkeleton />;
  return (
    <>
      <PageTitle eyebrow="Cadastro" title={id === "nova" ? "Nova associada" : (data?.nome_exibicao ?? data?.nome_completo ?? "Editar")} />
      <AssociadaForm
        admin
        initial={data ?? { situacao: "adimplente", pagina_ativa: true, exibir_whatsapp: true, exibir_email: true, exibir_cidade: true, plano: "Elite" }}
        onSaved={(a) => {
          qc.invalidateQueries();
          navigate({ to: "/admin/associadas/$id", params: { id: a.id } });
        }}
      />
    </>
  );
}
