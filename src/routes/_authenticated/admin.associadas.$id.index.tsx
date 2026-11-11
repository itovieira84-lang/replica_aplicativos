import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { ChevronLeft, ChevronRight, Copy, Download, ExternalLink, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageTitle, Panel, StatusBadge } from "@/components/brand";
import { UsoDialog } from "@/components/uso-dialog";
import { fmtDate, fmtMonth, monthKey, podeUsar, shiftMonth, todayISO, usadoNoMes, useTable } from "@/lib/elite";

export const Route = createFileRoute("/_authenticated/admin/associadas/$id/")({
  head: () => ({ meta: [
    { title: "Ficha da associada — Elite Club" },
    { name: "description", content: "Dados e benefícios da associada Elite Club." },
    { property: "og:title", content: "Ficha da associada — Elite Club" },
    { property: "og:description", content: "Dados e benefícios da associada Elite Club." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Ficha,
});

function Ficha() {
  const { id } = Route.useParams();
  const { data: assoc = [] } = useTable("associadas", "nome_completo");
  const { data: bens = [] } = useTable("beneficios", "ordem");
  const { data: usos = [] } = useTable("usos", "data", false);
  const [ym, setYm] = useState(monthKey(todayISO()));
  const a = assoc.find((x) => x.id === id);
  if (!a) return null;
  const url = a.slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/m/${a.slug}` : "";
  const hist = usos.filter((u) => u.associada_id === id);
  const elig = podeUsar(a);

  function baixarQR() {
    const c = document.getElementById("qr-assoc") as HTMLCanvasElement;
    const l = document.createElement("a");
    l.href = c.toDataURL("image/png");
    l.download = `qrcode-${a!.slug}.png`;
    l.click();
  }

  const dados: [string, string | null | undefined][] = [
    ["E-mail", a.email], ["WhatsApp", a.whatsapp], ["Telefone", a.telefone], ["CPF", a.cpf], ["RG", a.rg], ["Nascimento", fmtDate(a.nascimento)],
    ["Empresa", a.empresa], ["Cargo", a.cargo], ["Segmento", a.segmento], ["CNPJ", a.cnpj],
    ["Endereço", [a.rua, a.numero, a.complemento, a.bairro, a.cidade, a.uf, a.cep].filter(Boolean).join(", ")],
    ["Plano", a.plano], ["Vigência", `${fmtDate(a.vigencia_inicio)} a ${fmtDate(a.vigencia_fim)}`], ["Vencimento", a.dia_vencimento ? `Dia ${a.dia_vencimento}` : null],
    ["Endereço fiscal", a.usa_endereco_fiscal ? "Sim" : "Não"], ["Observações", a.observacoes_internas],
  ];

  return (
    <>
      <PageTitle eyebrow="Ficha da associada" title={a.nome_exibicao ?? a.nome_completo}>
        <Button variant="outline" size="sm" asChild><Link to="/admin/associadas/$id/editar" params={{ id }}><Pencil /> Editar</Link></Button>
        <UsoDialog associadaId={id} trigger={<Button size="sm"><Plus /> Uso</Button>} />
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="flex flex-col items-center text-center">
          <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-primary bg-secondary">
            {a.foto_url && <img src={a.foto_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <p className="mt-4 font-display text-2xl">{a.nome_completo}</p>
          <p className="text-sm text-muted-foreground">{[a.cargo, a.empresa].filter(Boolean).join(" · ")}</p>
          <div className="mt-3"><StatusBadge value={a.situacao} /></div>
          {!elig.ok && <p className="mt-2 text-xs text-destructive">Benefícios bloqueados: {elig.motivo}</p>}
          {url && (
            <>
              <div className="mt-6 rounded-xl border bg-background p-3"><QRCodeCanvas id="qr-assoc" value={url} size={150} fgColor="#14110D" bgColor="#FFFDF9" /></div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={baixarQR}><Download /> QR</Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copiado."); }}><Copy /> Link</Button>
                <Button variant="ghost" size="sm" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink /> Abrir</a></Button>
              </div>
              {!a.pagina_ativa && <p className="mt-2 text-xs text-muted-foreground">Página pública desativada.</p>}
            </>
          )}
        </Panel>

        <Panel className="lg:col-span-2">
          <div className="mb-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setYm(shiftMonth(ym, -1))}><ChevronLeft /></Button>
            <p className="text-center font-display text-2xl">{fmtMonth(ym)}</p>
            <Button variant="ghost" size="icon" onClick={() => setYm(shiftMonth(ym, 1))}><ChevronRight /></Button>
          </div>
          <p className="eyebrow mb-3 text-primary">Saldo do mês por benefício</p>
          <div className="space-y-4">
            {bens.filter((b) => b.ativo).map((b) => {
              const u = usadoNoMes(usos, id, b.id, ym);
              const lim = b.limite_mensal != null ? Number(b.limite_mensal) : null;
              return (
                <div key={b.id}>
                  <div className="mb-1 grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
                    <span className="truncate">{b.titulo}</span>
                    <span className="text-muted-foreground">{lim != null ? `${u} / ${lim} ${b.unidade}` : `${u} · sem limite`}</span>
                  </div>
                  {lim != null && <Progress value={Math.min(100, (u / lim) * 100)} className="h-1.5" />}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <p className="eyebrow mb-3 text-primary">Histórico</p>
          <ul className="divide-y text-sm">
            {hist.map((u) => (
              <li key={u.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate">{bens.find((b) => b.id === u.beneficio_id)?.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fmtDate(u.data)} {u.horario?.slice(0, 5)} · {Number(u.quantidade)} · {u.origem}
                    {u.convidada_nome && ` · Convidada: ${u.convidada_nome}`}
                    {u.excecao && ` · Exceção: ${u.justificativa}`}
                  </p>
                </div>
                <StatusBadge value={u.status} />
              </li>
            ))}
            {hist.length === 0 && <li className="py-3 text-muted-foreground">Sem registros.</li>}
          </ul>
        </Panel>

        <Panel>
          <p className="eyebrow mb-3 text-primary">Dados cadastrais</p>
          <dl className="space-y-2 text-sm">
            {dados.map(([k, v]) => (
              <div key={k}><dt className="eyebrow text-[0.55rem] text-muted-foreground">{k}</dt><dd className="break-words">{v || "—"}</dd></div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
}
