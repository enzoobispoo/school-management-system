import re, os

BASE = "/Users/enzobispo/Downloads/b_oaPgD0xj9Dm-1774041368222"

# Files with notificacao.create missing schoolId
notif_files = [
    "app/api/alunos/route.ts",
    "app/api/cursos/route.ts",
    "app/api/professores/route.ts",
    "app/api/turmas/route.ts",
    "app/api/turmas/[id]/trocar-professor/route.ts",
    "app/api/matriculas/route.ts",
    "app/api/matriculas/[id]/route.ts",
    "app/api/pagamentos/route.ts",
    "app/api/pagamentos/[id]/route.ts",
    "app/api/pagamentos/[id]/pagar/route.ts",
    "app/api/notificacoes/route.ts",
    "app/api/webhooks/asaas/route.ts",
    "lib/ai/actions/register-payment.ts",
]

for rel in notif_files:
    path = os.path.join(BASE, rel)
    if not os.path.exists(path):
        continue
    c = open(path).read()
    # Add schoolId to notificacao.create data blocks that don't have it
    c = re.sub(
        r'(prisma\.notificacao\.create\(\s*\{\s*data:\s*\{)(?!\s*schoolId)',
        r'\1\n          schoolId,',
        c
    )
    open(path, 'w').write(c)
    print(f"Fixed notificacao.create: {rel}")

print("Done notificacoes")
