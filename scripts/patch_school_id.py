import re, os

files = [
    "app/api/settings/escola/route.ts",
    "app/api/settings/financeiro/route.ts",
    "app/api/settings/notificacoes/route.ts",
    "app/api/settings/aparencia/route.ts",
    "app/api/configuracoes/escola/route.ts",
    "app/api/configuracoes/escola/public/route.ts",
    "lib/services/payment-generator.ts",
    "lib/services/auto-payment-reminder.ts",
]

for f in files:
    if not os.path.exists(f):
        continue
    c = open(f).read()
    c = re.sub(r'where:\s*\{\s*id:\s*["\']default["\']\s*\}', 'where: { schoolId }', c)
    c = re.sub(r'where:\s*\{\s*schoolId:\s*["\']default["\']\s*\}', 'where: { schoolId }', c)
    open(f, 'w').write(c)
    print("Patched", f)
