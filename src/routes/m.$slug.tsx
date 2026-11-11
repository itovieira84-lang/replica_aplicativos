import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Mail, MessageCircle, Phone, Share2, UserPlus, MapPin, Instagram, Linkedin, Globe, Briefcase, Facebook, Youtube, Music2, ChevronRight, UserRound } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { DialogSeal, GoldDivider } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseFetch } from "@/integrations/supabase/client";
import { socialUrl, waLink } from "@/lib/elite";

type K = "nome" | "frase_destaque" | "cargo" | "empresa" | "whatsapp" | "telefone" | "email" | "cidade" | "uf" | "bio" | "servicos" | "foto_url" | "instagram" | "linkedin" | "facebook" | "tiktok" | "youtube" | "site" | "portfolio" | "segmento" | "slug";
type Pub = Partial<Record<K, string | null>>;

// Runs on the server so the public card is rendered with real data (good for WhatsApp/Instagram link previews).
const getPagina = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: supabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
    });
    const { data: r } = await sb.rpc("pagina_publica", { _slug: data.slug });
    return (r as Pub | null) ?? null;
  });

export const Route = createFileRoute("/m/$slug")({
  loader: async ({ params }) => {
    const p = await getPagina({ data: { slug: params.slug } });
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData["nome"]} — Associada Elite Club` : "Elite Club";
    const d = loaderData?.frase_destaque ?? [loaderData?.cargo, loaderData?.empresa].filter(Boolean).join(" · ");
    const meta = [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary_large_image" }];
    if (loaderData?.foto_url?.startsWith("http")) meta.push({ property: "og:image", content: loaderData.foto_url });
    return { meta };
  },
  component: Pagina,
});

function Pagina() {
  const p = Route.useLoaderData();
  const url = typeof window !== "undefined" ? window.location.href : "";
  const wa = waLink(p.whatsapp, `Olá, ${p.nome}! Vi seu cartão do Elite Club e gostaria de conversar.`);

  function vcf() {
    const v = ["BEGIN:VCARD", "VERSION:3.0", `FN:${p.nome}`, p.empresa && `ORG:${p.empresa}`, p.cargo && `TITLE:${p.cargo}`, p.whatsapp && `TEL;TYPE=CELL:+55${p.whatsapp.replace(/\D/g, "")}`, p.telefone && `TEL;TYPE=WORK:${p.telefone}`, p.email && `EMAIL:${p.email}`, p.site && `URL:${socialUrl("site", p.site)}`, `NOTE:Associada Elite Club`, "END:VCARD"].filter(Boolean).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([v], { type: "text/vcard" }));
    a.download = `${p.slug}.vcf`;
    a.click();
  }
  async function share() {
    if (navigator.share) await navigator.share({ title: p.nome ?? "", url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); toast.success("Link copiado!"); }
  }

  const actions = [
    wa && { icon: MessageCircle, label: "WhatsApp", href: wa },
    p.telefone && { icon: Phone, label: "Ligar", href: `tel:${p.telefone.replace(/\D/g, "")}` },
    p.email && { icon: Mail, label: "E-mail", href: `mailto:${p.email}` },
    { icon: UserPlus, label: "Salvar", onClick: vcf },
    { icon: Share2, label: "Compartilhar", onClick: share },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href?: string; onClick?: () => void }[];

  const links = ([["instagram", "Instagram", Instagram], ["linkedin", "LinkedIn", Linkedin], ["site", "Site", Globe], ["portfolio", "Portfólio", Briefcase], ["facebook", "Facebook", Facebook], ["tiktok", "TikTok", Music2], ["youtube", "YouTube", Youtube]] as const).filter(([k]) => p[k]);
  const servicos = (p.servicos ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="public-page min-h-screen px-5 py-10 text-ink-foreground">
      <div className="mx-auto max-w-lg">
        <img src="/brand/elite-mark.png" alt="Elite Club" className="mx-auto h-16" />
        <div className="mt-8 text-center">
          <div className="mx-auto h-44 w-44 overflow-hidden rounded-full border-2 border-primary p-1">
            <div className="h-full w-full overflow-hidden rounded-full bg-ink-soft">{p.foto_url ? <img src={p.foto_url} alt={p.nome ?? ""} className="h-full w-full object-cover" /> : <UserRound className="mx-auto mt-12 h-16 w-16 text-primary/50" />}</div>
          </div>
          <span className="mt-5 inline-block rounded-full border border-primary/60 px-4 py-1 eyebrow text-[0.58rem] text-primary">Associada Elite Club</span>
          <h1 className="mt-4 font-brand text-5xl leading-tight break-words">{p.nome}</h1>
          <p className="mt-2 text-sm text-ink-foreground/70">{[p.cargo, p.empresa].filter(Boolean).join(" · ")}</p>
          {p.frase_destaque && <p className="mt-4 font-brand text-2xl italic text-primary">“{p.frase_destaque}”</p>}
          {p.cidade && <p className="mt-3 flex items-center justify-center gap-1 text-xs text-ink-foreground/60"><MapPin className="h-3 w-3" />{p.cidade}{p.uf && ` — ${p.uf}`}</p>}
        </div>

        <div className="mt-8 grid grid-cols-5 gap-2">
          {actions.map((a) => {
            const inner = <><span className="public-action-icon"><a.icon className="h-5 w-5 text-primary" /></span><span className="text-[10px] font-normal">{a.label}</span></>;
            const cls = "public-action flex flex-col items-center gap-2 transition-all active:scale-[0.97]";
            return a.href ? <Button variant="ghost" asChild key={a.label} className={cls}><a href={a.href} target="_blank" rel="noreferrer">{inner}</a></Button> : <Button variant="ghost" key={a.label} onClick={a.onClick} className={cls}>{inner}</Button>;
          })}
        </div>

        {links.length > 0 && (
          <div className="mt-6 space-y-2.5">
            {links.map(([k, l, Icon]) => (
              <a key={k} href={socialUrl(k, p[k])} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl glass-dark px-5 py-4 text-ink-foreground transition-transform hover:-translate-y-0.5">
                <Icon className="h-5 w-5 text-primary" /><span className="eyebrow flex-1">{l}</span><ChevronRight className="h-4 w-4 text-ink-foreground/50" />
              </a>
            ))}
          </div>
        )}

        {p.bio && <Section title="Sobre"><p className="text-sm leading-relaxed text-ink-foreground/80">{p.bio}</p></Section>}
        {servicos.length > 0 && <Section title="Serviços"><ul className="space-y-2 text-sm">{servicos.map((s) => <li key={s} className="flex gap-2"><span className="text-primary">✦</span>{s}</li>)}</ul></Section>}
        {p.segmento && <Section title="Segmento"><p className="font-display text-2xl">{p.segmento}</p></Section>}

        <div className="mt-10 flex justify-center"><div className="qr-surface rounded-3xl p-5">{url && <QRCodeSVG value={url} size={140} fgColor="currentColor" bgColor="transparent" />}</div></div>
        <footer className="mt-12 space-y-5 border-t border-primary/20 pt-8 text-center">
          <img src="/brand/elite-horizontal-light.png" alt="Elite Club" className="mx-auto h-9" />
          <DialogSeal />
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <GoldDivider className="mb-5" />
      <p className="eyebrow mb-3 text-primary">{title}</p>
      {children}
    </section>
  );
}
