import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Associada = Database["public"]["Tables"]["associadas"]["Row"];
export type Beneficio = Database["public"]["Tables"]["beneficios"]["Row"];
export type Parceiro = Database["public"]["Tables"]["parceiros"]["Row"];
export type Uso = Database["public"]["Tables"]["usos"]["Row"];
export type Encontro = Database["public"]["Tables"]["encontros"]["Row"];

export const SITUACOES = ["adimplente", "inadimplente", "suspensa", "cancelada"] as const;
export const STATUS = ["pendente", "confirmado", "recusado", "cancelado"] as const;
export const TIPOS = ["encontro", "convidada", "sala", "endereco_fiscal", "desconto", "experiencia", "comunidade", "campanha"] as const;
export const TIPO_LABEL: Record<string, string> = {
  encontro: "Encontro", convidada: "Convidada", sala: "Sala", endereco_fiscal: "Endereço fiscal",
  desconto: "Desconto", experiencia: "Experiência", comunidade: "Comunidade", campanha: "Campanha",
};
export const CONDICOES_GERAIS =
  "Descontos não são convertíveis em dinheiro nem necessariamente cumulativos. O almoço após os encontros é consumo individual, salvo comunicação em contrário.";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const [{ data: roles }, { data: assoc }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("associadas").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      return { user, isAdmin: !!roles?.some((r) => r.role === "admin"), associada: assoc as Associada | null };
    },
  });
}

export function useTable<T extends keyof Database["public"]["Tables"]>(table: T, order = "created_at", asc = true) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order(order, { ascending: asc });
      if (error) throw error;
      return data as unknown as Database["public"]["Tables"][T]["Row"][];
    },
  });
}

export const monthKey = (d: Date | string) => (typeof d === "string" ? d : d.toISOString()).slice(0, 7);
export const todayISO = () => new Date().toLocaleDateString("sv-SE");
export const fmtDate = (d?: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—");
export const fmtMonth = (ym: string) => {
  const s = new Date(ym + "-15T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const shiftMonth = (ym: string, n: number) => {
  const d = new Date(ym + "-15T12:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 7);
};
export const onlyDigits = (s?: string | null) => (s ?? "").replace(/\D/g, "");

export function usadoNoMes(usos: Uso[], associadaId: string, beneficioId: string, ym: string) {
  return usos
    .filter((u) => u.associada_id === associadaId && u.beneficio_id === beneficioId && u.data.startsWith(ym) && (u.status === "pendente" || u.status === "confirmado"))
    .reduce((s, u) => s + Number(u.quantidade), 0);
}

export function podeUsar(a: Associada, data = todayISO()) {
  if (a.situacao !== "adimplente") return { ok: false, motivo: `Situação: ${a.situacao}` };
  if (a.vigencia_inicio && data < a.vigencia_inicio) return { ok: false, motivo: "Vigência ainda não iniciada" };
  if (a.vigencia_fim && data > a.vigencia_fim) return { ok: false, motivo: "Vigência encerrada" };
  return { ok: true, motivo: "" };
}

export function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function downloadCSV(name: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

export function waLink(phone?: string | null, msg?: string) {
  let d = onlyDigits(phone);
  if (!d) return undefined;
  if (!d.startsWith("55")) d = "55" + d;
  return `https://wa.me/${d}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
}

export function socialUrl(kind: string, v?: string | null) {
  if (!v) return undefined;
  if (/^https?:\/\//.test(v)) return v;
  const h = v.replace(/^@/, "");
  const base: Record<string, string> = {
    instagram: "https://instagram.com/", tiktok: "https://tiktok.com/@", facebook: "https://facebook.com/",
    youtube: "https://youtube.com/@", linkedin: "https://linkedin.com/in/",
  };
  return base[kind] ? base[kind] + h : `https://${h}`;
}

/** Shrinks a photo in the browser and returns a JPEG blob ready for upload. */
export async function resizeImage(file: File, max = 640): Promise<Blob> {
  const img = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao processar a imagem."))), "image/jpeg", 0.85));
}

/** Uploads the photo to the public "fotos" bucket, in the associada's own folder, and returns its URL. */
export async function uploadFoto(associadaId: string, file: File): Promise<string> {
  const blob = await resizeImage(file);
  const path = `${associadaId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("fotos").upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
}

export function errMsg(e: unknown) {
  return e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Erro inesperado";
}
