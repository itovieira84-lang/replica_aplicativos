import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogSeal, GoldDivider } from "@/components/brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Elite Club" },
      { name: "description", content: "Acesse a área da associada ou a administração do Elite Club." },
      { property: "og:title", content: "Entrar — Elite Club" },
      { property: "og:description", content: "Acesse a plataforma do Elite Club." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const ERROS: [string, string][] = [
  ["Invalid login credentials", "E-mail ou senha inválidos."],
  ["Email not confirmed", "Confirme seu e-mail pelo link que enviamos antes de entrar."],
  ["User already registered", "Este e-mail já tem acesso. Use \"Entrar\" ou \"Esqueci a senha\"."],
  ["rate limit", "Muitas tentativas. Aguarde alguns minutos e tente de novo."],
];

function traduz(msg: string) {
  return ERROS.find(([k]) => msg.toLowerCase().includes(k.toLowerCase()))?.[1] ?? msg;
}

function AuthPage() {
  const [tab, setTab] = useState<"associada" | "admin">("associada");
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "criar") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) {
          toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
          setMode("entrar");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? traduz(err.message) : "Erro");
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email) return void toast.error("Informe seu e-mail primeiro.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(traduz(error.message));
    else toast.success("Enviamos um link de redefinição para seu e-mail.");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="login-brand flex flex-col items-center justify-center gap-6 px-6 py-9 lg:gap-10 lg:py-0">
        <img src="/brand/elite-vertical.png" alt="Elite Club" className="h-28 w-auto sm:h-44 lg:h-64" />
        <p className="max-w-xs text-center font-brand text-xl italic text-ink-foreground/70">
          O clube de negócios das mulheres que constroem o extraordinário.
        </p>
        <DialogSeal />
      </div>
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-9">
          <div className="mb-8 grid grid-cols-2 rounded-2xl bg-muted p-1">
            {(["associada", "admin"] as const).map((t) => (
              <Button
                variant="ghost"
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn("h-11 rounded-xl px-2 text-xs transition-all", tab === t ? "bg-card text-foreground shadow-soft" : "text-muted-foreground")}
              >
                {t === "associada" ? "Sou associada" : "Administração"}
              </Button>
            ))}
          </div>
          <p className="eyebrow text-primary">{tab === "associada" ? "Área da associada" : "Painel administrativo"}</p>
          <h1 className="mt-2 text-4xl font-bold">{mode === "entrar" ? "Bem-vinda" : "Primeiro acesso"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "criar" && tab === "associada"
              ? "Use o mesmo e-mail cadastrado pelo clube para vincular sua ficha."
              : "Entre com seu e-mail e senha."}
          </p>
          <GoldDivider className="my-6" />
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="auth-email" className="text-xs text-muted-foreground">E-mail</Label>
              <Input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auth-password" className="text-xs text-muted-foreground">Senha</Label>
              <Input id="auth-password" type="password" autoComplete={mode === "entrar" ? "current-password" : "new-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-muted" />
            </div>
            <Button type="submit" disabled={busy} className="w-full" size="lg">
              {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar acesso"}
            </Button>
          </form>
          <div className="mt-5 flex justify-between text-xs text-muted-foreground">
            <Button variant="link" type="button" onClick={() => setMode(mode === "entrar" ? "criar" : "entrar")} className="h-auto min-h-11 whitespace-normal px-0 text-xs text-muted-foreground">
              {mode === "entrar" ? "Primeiro acesso? Criar senha" : "Já tenho acesso"}
            </Button>
            {mode === "entrar" && <Button variant="link" type="button" onClick={forgot} className="h-auto min-h-11 px-0 text-xs text-muted-foreground">Esqueci a senha</Button>}
          </div>
          <DialogSeal dark={false} className="mt-12 lg:hidden" />
        </div>
      </div>
    </div>
  );
}
