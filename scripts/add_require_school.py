import re, os, sys

BASE = "/Users/enzobispo/Downloads/b_oaPgD0xj9Dm-1774041368222"

# For each route file, we need to:
# 1. Add requireSchool import
# 2. Extract schoolId from user in each handler
# 3. Add schoolId to all prisma create/findMany/count/findFirst calls

routes_needing_school = [
    "app/api/alunos/route.ts",
    "app/api/alunos/[id]/route.ts",
    "app/api/alunos/[id]/pagamentos-em-aberto/route.ts",
    "app/api/cursos/route.ts",
    "app/api/cursos/[id]/route.ts",
    "app/api/professores/route.ts",
    "app/api/professores/[id]/route.ts",
    "app/api/turmas/route.ts",
    "app/api/turmas/[id]/route.ts",
    "app/api/turmas/[id]/trocar-professor/route.ts",
    "app/api/turmas/[id]/historico-professores/route.ts",
    "app/api/turmas/[id]/professores-disponiveis/route.ts",
    "app/api/turmas/[id]/change-teacher/route.ts",
    "app/api/matriculas/route.ts",
    "app/api/matriculas/[id]/route.ts",
    "app/api/pagamentos/route.ts",
    "app/api/pagamentos/[id]/route.ts",
    "app/api/pagamentos/[id]/pagar/route.ts",
    "app/api/pagamentos/[id]/envios/route.ts",
    "app/api/pagamentos/gerar-mensalidades/route.ts",
    "app/api/pagamentos/meses-disponiveis/route.ts",
    "app/api/eventos/route.ts",
    "app/api/eventos/[id]/route.ts",
    "app/api/notificacoes/route.ts",
    "app/api/notificacoes/[id]/route.ts",
    "app/api/calendario/route.ts",
    "app/api/dashboard/route.ts",
    "app/api/relatorios/route.ts",
    "app/api/relatorios/inadimplencia/route.ts",
    "app/api/search/route.ts",
    "app/api/cobrancas/enviar/route.ts",
    "app/api/cobrancas/enviar-todos/route.ts",
    "app/api/cobrancas/gerar-boleto/route.ts",
    "app/api/cobrancas/gerar-boleto-lote/route.ts",
    "app/api/alunos/documentos/route.ts",
    "app/api/alunos/foto/route.ts",
    "app/api/alunos/status-historico/route.ts",
]

for rel in routes_needing_school:
    path = os.path.join(BASE, rel)
    if not os.path.exists(path):
        print(f"SKIP (not found): {rel}")
        continue
    
    c = open(path).read()
    
    # Add requireSchool to import if not present
    if "requireSchool" not in c:
        c = re.sub(
            r'(import \{ getCurrentUser[^}]*\} from "@/lib/auth")',
            lambda m: m.group(0).replace("getCurrentUser", "getCurrentUser, requireSchool"),
            c
        )
    
    open(path, 'w').write(c)
    print(f"Updated imports: {rel}")

print("Done")
