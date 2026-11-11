import { useEffect, useState, type ReactNode } from "react";
import { UsersRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function DialogSeal({ className, dark = true }: { className?: string; dark?: boolean }) {
  return <div className={cn("flex items-center justify-center gap-2", className)}><img src="/brand/dialog-mark.png" alt="" className="h-6 w-6 rounded-full bg-dialog-navy object-cover" /><span className={cn("text-[10px] font-medium", dark ? "text-dialog-pink" : "text-muted-foreground")}>Ecossistema Clube Dialog</span></div>;
}
export function GoldDivider({ className }: { className?: string }) {
  return <div className={cn("flex items-center gap-3 text-primary", className)}><span className="h-px flex-1 bg-primary/20" /><span className="text-xs">✦</span><span className="h-px flex-1 bg-primary/20" /></div>;
}
export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  const [compact, setCompact] = useState(false);
  useEffect(() => { const update = () => setCompact(window.scrollY > 64); update(); window.addEventListener("scroll", update, { passive: true }); return () => window.removeEventListener("scroll", update); }, []);
  return <div className={cn("large-title grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4", compact && "is-compact")}><div className="min-w-0">{eyebrow && <p className="mb-2 text-xs font-medium text-muted-foreground">{eyebrow}</p>}<h1>{title}</h1></div>{children && <div className="flex flex-wrap justify-end gap-2">{children}</div>}</div>;
}
export function StatusBadge({ value }: { value: string }) {
  const tone: Record<string, string> = { adimplente: "bg-success/10 text-success", confirmado: "bg-success/10 text-success", pendente: "bg-warning/10 text-warning", inadimplente: "bg-destructive/10 text-destructive", recusado: "bg-destructive/10 text-destructive", suspensa: "bg-muted text-muted-foreground", cancelada: "bg-muted text-muted-foreground", cancelado: "bg-muted text-muted-foreground" };
  return <span className={cn("inline-flex w-fit items-center self-start rounded-full px-3 py-1.5 text-[11px] font-medium leading-none", tone[value] ?? "bg-muted text-muted-foreground")}>{value}</span>;
}
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("elite-panel min-w-0 p-5 sm:p-6", className)}>{children}</div>;
}
export function EmptyState({ children, text, icon: Icon = UsersRound }: { children?: ReactNode; text: string; icon?: LucideIcon }) {
  return <div className="flex min-h-60 flex-col items-center justify-center gap-5 px-6 py-10 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10"><Icon className="h-9 w-9 text-primary-hover" /></div><p className="max-w-sm text-sm text-muted-foreground">{text}</p>{children}</div>;
}
export function PageSkeleton() {
  return <div aria-label="Carregando" className="grid gap-5 py-8"><Skeleton className="h-10 w-48 rounded-2xl" /><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-44 rounded-3xl" />)}</div></div>;
}
