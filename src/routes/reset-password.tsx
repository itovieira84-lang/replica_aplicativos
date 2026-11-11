import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nova senha — Elite Club" },
      { name: "description", content: "Defina uma nova senha de acesso." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <form
        className="glass w-full max-w-sm space-y-5 rounded-3xl p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) return void toast.error(error.message.includes("session") ? "O link expirou. Peça um novo em \"Esqueci a senha\"." : error.message);
          toast.success("Senha atualizada.");
          navigate({ to: "/" });
        }}
      >
        <img src="/brand/elite-horizontal.png" alt="Elite Club" className="mx-auto h-12" />
        <h1 className="text-center text-3xl">Nova senha</h1>
        <Input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nova senha (mínimo 6 caracteres)" className="h-11 bg-card" />
        <Button className="w-full" size="lg" disabled={busy}>{busy ? "Salvando…" : "Salvar"}</Button>
      </form>
    </div>
  );
}
