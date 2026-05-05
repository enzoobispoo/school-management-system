import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const aluno = await prisma.aluno.create({
    data: {
      nome: "Lucas Henrique Ferreira",
      email: "lucas.ferreira@email.com",
      cpf: "52998224725",
      telefone: "11987654321",
      dataNascimento: new Date("2010-05-14"),
      endereco: "Rua das Flores, 123 - Vila Nova, São Paulo - SP",
      responsavelNome: "Carla Ferreira",
      responsavelTelefone: "11912345678",
      responsavelEmail: "carla.ferreira@email.com",
      responsavelCpf: "29537912890",
      possuiLaudo: true,
      laudoTipo: "TEA (Transtorno do Espectro Autista)",
      laudoCid: "F84.0",
      laudoNivel: "moderado",
      laudoProfissional: "Dra. Beatriz Almeida",
      laudoData: new Date("2021-08-10"),
      laudoDescricao: "Aluno com TEA nível 2, apresenta dificuldades de comunicação social e comportamentos repetitivos. Responde bem a rotinas estruturadas.",
      adaptacaoNecessaria: true,
      adaptacaoDescricao: "Necessita de tempo extra nas avaliações, assento preferencial na frente da sala e apoio de monitor.",
      alergias: "Amendoim, látex",
      medicamentos: "Risperidona 0,5mg (manhã)",
      condicoesCronicas: "Nenhuma",
      planoSaude: "Unimed",
      contatoEmergenciaNome: "Carla Ferreira",
      contatoEmergenciaTelefone: "11912345678",
      observacoesMedicas: "Evitar ambientes com muitos estímulos sonoros simultâneos.",
      observacoesProf: "Lucas responde melhor a instruções visuais. Evitar mudanças bruscas de rotina sem aviso prévio.",
    },
  });

  console.log("✅ Aluno criado:", aluno.nome, "| ID:", aluno.id);
}

main()
  .catch((e) => { console.error("❌ Erro:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
