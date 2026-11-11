import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Panel } from "@/components/brand";
import { SITUACOES, errMsg, slugify, uploadFoto, type Associada } from "@/lib/elite";

type Form = Partial<Associada>;

const SECTIONS: { title: string; admin?: boolean; fields: [keyof Associada, string, string?][] }[] = [
  { title: "Dados pessoais", fields: [["nome_completo", "Nome completo"], ["nome_exibicao", "Nome de exibição"], ["nascimento", "Nascimento", "date"]] },
  { title: "Documentos", admin: true, fields: [["cpf", "CPF"], ["rg", "RG"]] },
  { title: "Contato", fields: [["email", "E-mail", "email"], ["whatsapp", "WhatsApp (DDD + número)"], ["telefone", "Telefone"]] },
  { title: "Negócio", fields: [["empresa", "Empresa"], ["cargo", "Cargo"], ["segmento", "Segmento"], ["cnpj", "CNPJ"]] },
  { title: "Endereço", fields: [["cep", "CEP"], ["rua", "Rua"], ["numero", "Número"], ["complemento", "Complemento"], ["bairro", "Bairro"], ["cidade", "Cidade"], ["uf", "UF"]] },
  { title: "Redes e links", fields: [["instagram", "Instagram"], ["linkedin", "LinkedIn"], ["facebook", "Facebook"], ["tiktok", "TikTok"], ["youtube", "YouTube"], ["site", "Site"], ["portfolio", "Portfólio"]] },
  { title: "Contrato", admin: true, fields: [["plano", "Plano"], ["vigencia_inicio", "Início da vigência", "date"], ["vigencia_fim", "Fim da vigência", "date"], ["dia_vencimento", "Dia de vencimento", "number"]] },
];

export function AssociadaForm({ initial, admin, onSaved }: { initial: Form; admin: boolean; onSaved?: (a: Associada) => void }) {
  const [f, setF] = useState<Form>(initial);
  // A new record gets its id up front so the photo can go into its Storage folder before the first save.
  const [id] = useState(() => initial.id ?? crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof Associada, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function onFoto(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      set("foto_url", await uploadFoto(id, file));
    } catch (e) {
      toast.error(`Não foi possível enviar a foto: ${errMsg(e)}`);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!f.nome_completo?.trim()) return void toast.error("Informe o nome completo.");
    setBusy(true);
    const payload = { ...f, slug: f.slug || slugify(f.nome_exibicao || f.nome_completo || ""), dia_vencimento: f.dia_vencimento ? Number(f.dia_vencimento) : null };
    for (const k of Object.keys(payload) as (keyof typeof payload)[]) if (payload[k] === "") (payload as Record<string, unknown>)[k] = null;
    delete (payload as Record<string, unknown>)["created_at"];
    const q = initial.id
      ? supabase.from("associadas").update(payload).eq("id", initial.id).select().single()
      : supabase.from("associadas").insert({ ...payload, id } as Associada).select().single();
    const { data, error } = await q;
    setBusy(false);
    if (error) return void toast.error(error.message.includes("slug") ? "Este endereço de página já está em uso." : errMsg(error));
    toast.success("Dados salvos.");
    onSaved?.(data as Associada);
  }

  return (
    <div className="space-y-6">
      <Panel>
        <p className="eyebrow mb-4 text-primary">Foto e página</p>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-primary bg-secondary">
            {f.foto_url && <img src={f.foto_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="space-y-2">
            <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => onFoto(e.target.files?.[0])} />
            <p className="text-xs text-muted-foreground">{uploading ? "Enviando foto…" : "A imagem é reduzida automaticamente. Clique em Salvar para confirmar."}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Endereço da página (/m/…)"><Input value={f.slug ?? ""} onChange={(e) => set("slug", slugify(e.target.value))} /></Field>
          <Field label="Frase de destaque"><Input value={f.frase_destaque ?? ""} onChange={(e) => set("frase_destaque", e.target.value)} /></Field>
          <Field label="Bio" className="sm:col-span-2"><Textarea rows={4} value={f.bio ?? ""} onChange={(e) => set("bio", e.target.value)} /></Field>
          <Field label="Serviços (um por linha)" className="sm:col-span-2"><Textarea rows={4} value={f.servicos ?? ""} onChange={(e) => set("servicos", e.target.value)} /></Field>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {([["pagina_ativa", "Página pública ativa"], ["exibir_whatsapp", "Exibir WhatsApp"], ["exibir_telefone", "Exibir telefone"], ["exibir_email", "Exibir e-mail"], ["exibir_cidade", "Exibir cidade"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center justify-between rounded-2xl border-0 bg-muted px-4 py-3 text-sm">
              {l}
              <Switch checked={!!f[k]} onCheckedChange={(v) => set(k, v)} />
            </label>
          ))}
        </div>
      </Panel>

      {SECTIONS.filter((s) => admin || !s.admin).map((s) => (
        <Panel key={s.title}>
          <p className="eyebrow mb-4 text-primary">{s.title}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {s.fields.map(([k, l, type]) => (
              <Field key={k} label={l}>
                <Input type={type ?? "text"} value={(f[k] as string | number | null) ?? ""} onChange={(e) => set(k, e.target.value)} />
              </Field>
            ))}
          </div>
        </Panel>
      ))}

      {admin && (
        <Panel>
          <p className="eyebrow mb-4 text-primary">Situação e controle interno</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Situação">
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={f.situacao ?? "adimplente"} onChange={(e) => set("situacao", e.target.value)}>
                {SITUACOES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <label className="flex items-center justify-between rounded-2xl border-0 bg-muted px-4 py-3 text-sm">
              Usa endereço fiscal
              <Switch checked={!!f.usa_endereco_fiscal} onCheckedChange={(v) => set("usa_endereco_fiscal", v)} />
            </label>
            <Field label="Observações internas" className="sm:col-span-2"><Textarea rows={3} value={f.observacoes_internas ?? ""} onChange={(e) => set("observacoes_internas", e.target.value)} /></Field>
          </div>
        </Panel>
      )}

      <div className="glass sticky bottom-4 flex justify-end rounded-3xl p-3">
        <Button size="lg" onClick={save} disabled={busy || uploading} className="shadow-soft">{busy ? "Salvando…" : "Salvar"}</Button>
      </div>
    </div>
  );
}

export function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block space-y-1.5 ${className ?? ""}`}>
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
