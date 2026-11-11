import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart3, Users, Ticket, Inbox, CalendarDays, Gift, Handshake, LogOut, Ellipsis, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DialogSeal } from "@/components/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/minha-area" });
  },
  head: () => ({
    meta: [
      { title: "Administração — Elite Club" },
      { name: "description", content: "Painel administrativo do Elite Club." },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Painel", icon: BarChart3, exact: true },
  { to: "/admin/associadas", label: "Associadas", icon: Users },
  { to: "/admin/usos", label: "Uso de benefícios", icon: Ticket },
  { to: "/admin/solicitacoes", label: "Solicitações", icon: Inbox, badge: true },
  { to: "/admin/encontros", label: "Encontros", icon: CalendarDays },
  { to: "/admin/beneficios", label: "Benefícios", icon: Gift },
  { to: "/admin/parceiros", label: "Parceiros", icon: Handshake },
] as const;

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: pend = 0 } = useQuery({
    queryKey: ["usos", "pendentes-count"],
    queryFn: async () => (await supabase.from("usos").select("id", { count: "exact", head: true }).eq("status", "pendente")).count ?? 0,
    refetchInterval: 30000,
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const navItem = (n: (typeof NAV)[number], mobile = false) => (
    <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }} onClick={() => setOpen(false)}
      className={cn("group relative flex items-center text-muted-foreground transition-all duration-200 data-[status=active]:text-primary-hover", mobile ? "flex-col justify-center gap-1 rounded-2xl px-1 text-[10px] data-[status=active]:bg-primary/10" : "gap-3 rounded-2xl px-4 py-3 text-sm hover:bg-sidebar-accent data-[status=active]:bg-primary/10")}>
      <n.icon className="h-5 w-5" />
      <span className={mobile ? "" : "flex-1"}>{mobile && n.label === "Uso de benefícios" ? "Usos" : n.label}</span>
      {"badge" in n && pend > 0 && <span className={cn("rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground", mobile && "absolute right-1 top-1")}>{pend}</span>}
    </Link>
  );
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="glass fixed inset-y-0 left-0 z-40 hidden w-64 flex-col p-5 lg:flex">
        <div className="mb-10 mt-3 rounded-2xl bg-ink px-4 py-5"><img src="/brand/elite-horizontal-light.png" alt="Elite Club" className="h-9 w-auto" /></div>
        <nav className="flex flex-1 flex-col gap-2">{NAV.map((n) => navItem(n))}</nav>
        <Button variant="ghost" onClick={signOut} className="mt-4 justify-start text-muted-foreground"><LogOut /> Sair</Button>
        <DialogSeal dark={false} className="mt-6 border-t border-sidebar-border pt-5" />
      </aside>
      <main className="admin-main mx-auto max-w-6xl px-5 pt-6 sm:px-8 sm:pt-8"><Outlet /></main>
      <nav aria-label="Navegação principal" className="admin-mobile-tabs glass fixed left-4 right-4 z-40 grid grid-cols-5 gap-1 rounded-3xl p-2 lg:hidden">
        {[NAV[0], NAV[1], NAV[3], NAV[4]].map((n) => navItem(n, true))}
        <Button variant="ghost" onClick={() => setOpen(true)} aria-label="Mais" aria-expanded={open} className="flex h-auto flex-col gap-1 rounded-2xl px-1 text-[10px] text-muted-foreground"><Ellipsis className="size-5" />Mais</Button>
      </nav>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>Mais</DialogTitle></DialogHeader>
        <div className="divide-y divide-border">{NAV.filter((n) => n.to === "/admin/usos" || n.to === "/admin/beneficios" || n.to === "/admin/parceiros").map((n) => <div key={n.to} className="relative">{navItem(n)}<ChevronRight className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-muted-foreground" /></div>)}</div>
        <Button variant="ghost" onClick={signOut} className="justify-start text-muted-foreground"><LogOut /> Sair</Button><DialogSeal dark={false} />
      </DialogContent></Dialog>
    </div>
  );
}
