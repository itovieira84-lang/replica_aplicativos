import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Elite Club — Plataforma das associadas" },
      { name: "description", content: "Clube de negócios para mulheres empreendedoras do ecossistema Clube Dialog." },
      { property: "og:title", content: "Elite Club" },
      { property: "og:description", content: "Clube de negócios para mulheres empreendedoras do ecossistema Clube Dialog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    throw redirect({ to: roles?.some((r) => r.role === "admin") ? "/admin" : "/minha-area" });
  },
  component: () => null,
});
