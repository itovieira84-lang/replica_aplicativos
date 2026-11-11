export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type AppRole = "admin" | "associada";
type SituacaoAssoc = "adimplente" | "inadimplente" | "suspensa" | "cancelada";
type StatusUso = "pendente" | "confirmado" | "recusado" | "cancelado";

type AssociadaRow = {
  bairro: string | null; bio: string | null; cargo: string | null; cep: string | null; cidade: string | null;
  cnpj: string | null; complemento: string | null; cpf: string | null; created_at: string; dia_vencimento: number | null;
  email: string | null; empresa: string | null; exibir_cidade: boolean; exibir_email: boolean; exibir_telefone: boolean;
  exibir_whatsapp: boolean; facebook: string | null; foto_url: string | null; frase_destaque: string | null; id: string;
  instagram: string | null; linkedin: string | null; nascimento: string | null; nome_completo: string; nome_exibicao: string | null;
  numero: string | null; observacoes_internas: string | null; pagina_ativa: boolean; plano: string | null; portfolio: string | null;
  rg: string | null; rua: string | null; segmento: string | null; servicos: string | null; site: string | null;
  situacao: SituacaoAssoc; slug: string | null; telefone: string | null; tiktok: string | null; uf: string | null;
  usa_endereco_fiscal: boolean; user_id: string | null; vigencia_fim: string | null; vigencia_inicio: string | null;
  whatsapp: string | null; youtube: string | null;
};
type BeneficioRow = {
  ativo: boolean; clausula: string | null; codigo: string | null; created_at: string; desconto_pct: number | null;
  descricao: string | null; exige_reserva: boolean; id: string; limite_mensal: number | null; ordem: number | null;
  parceiro_id: string | null; pode_solicitar: boolean; regras: string | null; tipo: string; titulo: string; unidade: string;
};
type EncontroRow = {
  created_at: string; data: string; descricao: string | null; fim: string | null; id: string; inicio: string | null;
  local: string | null; programacao: string[] | null; titulo: string;
};
type ParceiroRow = {
  ativo: boolean; categoria: string | null; created_at: string; descricao: string | null; ecossistema: string;
  email: string | null; id: string; instagram: string | null; logo_url: string | null; nome: string;
  responsavel: string | null; site: string | null; whatsapp: string | null;
};
type UserRoleRow = { id: string; role: AppRole; user_id: string };
type UsoRow = {
  associada_id: string; beneficio_id: string; convidada_email: string | null; convidada_instagram: string | null;
  convidada_nome: string | null; convidada_whatsapp: string | null; created_at: string; data: string;
  encontro_id: string | null; excecao: boolean; horario: string | null; id: string; justificativa: string | null;
  observacoes: string | null; origem: string; quantidade: number; status: StatusUso;
};

// Insert: only the columns without a database default are required.
type Ins<R, Req extends keyof R> = Partial<R> & Pick<R, Req>;

type Table<R, Req extends keyof R> = { Row: R; Insert: Ins<R, Req>; Update: Partial<R>; Relationships: [] };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.1" };
  public: {
    Tables: {
      associadas: Table<AssociadaRow, "nome_completo">;
      beneficios: Table<BeneficioRow, "titulo">;
      encontros: Table<EncontroRow, "data">;
      parceiros: Table<ParceiroRow, "nome">;
      user_roles: Table<UserRoleRow, "role" | "user_id">;
      usos: Table<UsoRow, "associada_id" | "beneficio_id">;
    };
    Views: { [_ in never]: never };
    Functions: {
      convidada_ja_participou: { Args: { _email: string; _whatsapp: string }; Returns: boolean };
      has_role: { Args: { _role: AppRole; _user_id: string }; Returns: boolean };
      pagina_publica: { Args: { _slug: string }; Returns: Json };
      saldo_usado: { Args: { _associada: string; _beneficio: string; _data: string; _excluir?: string }; Returns: number };
    };
    Enums: { app_role: AppRole; situacao_assoc: SituacaoAssoc; status_uso: StatusUso };
    CompositeTypes: { [_ in never]: never };
  };
};
