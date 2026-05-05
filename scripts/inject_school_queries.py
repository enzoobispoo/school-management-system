import re, os

BASE = "/Users/enzobispo/Downloads/b_oaPgD0xj9Dm-1774041368222"

# Pattern: after "const user = await getCurrentUser();" and auth check,
# inject "const result = requireSchool(user); if (result instanceof NextResponse) return result; const { schoolId } = result;"
# Then add schoolId to all prisma where clauses and create data

def inject_school_extraction(content):
    """After each auth check block, inject schoolId extraction if not present."""
    # Match: const user = await getCurrentUser();\n    if (!user) return ...;\n
    # and inject schoolId extraction after it
    pattern = r'(const user = await getCurrentUser\(\);\n\s+if \(!user\) return NextResponse\.json\(\{ error: [^}]+\}, \{ status: 401 \}\);)'
    
    def replacer(m):
        block = m.group(1)
        # Check if schoolId extraction already follows
        return block + '\n    const _school = requireSchool(user);\n    if (_school instanceof NextResponse) return _school;\n    const { schoolId } = _school;'
    
    # Only inject if schoolId not already extracted in this handler
    # We do a simpler approach: replace all occurrences
    result = re.sub(pattern, replacer, content)
    return result

def add_school_to_where(content):
    """Add schoolId to prisma findMany/count/findFirst where clauses."""
    # prisma.MODEL.findMany({ where: { ... } }) -> add schoolId
    # This is complex to do generically, so we handle the most common patterns
    
    models = ['aluno', 'curso', 'professor', 'turma', 'matricula', 'pagamento', 
              'evento', 'notificacao', 'userInvite']
    
    for model in models:
        # where: { (no schoolId yet)
        # Add schoolId as first filter
        content = re.sub(
            r'(prisma\.' + model + r'\.(findMany|count|findFirst|findUnique)\(\s*\{[^}]*where:\s*\{)(?!\s*schoolId)',
            r'\1\n          schoolId,',
            content
        )
    
    return content

def add_school_to_create(content):
    """Add schoolId to prisma create data."""
    models = ['aluno', 'curso', 'professor', 'turma', 'matricula', 'pagamento', 'evento', 'notificacao']
    
    for model in models:
        # prisma.MODEL.create({ data: { -> add schoolId
        content = re.sub(
            r'(prisma\.' + model + r'\.create\(\s*\{\s*data:\s*\{)(?!\s*schoolId)',
            r'\1\n        schoolId,',
            content
        )
    
    return content

files = [
    "app/api/alunos/route.ts",
    "app/api/cursos/route.ts",
    "app/api/professores/route.ts",
    "app/api/turmas/route.ts",
    "app/api/matriculas/route.ts",
    "app/api/pagamentos/route.ts",
    "app/api/eventos/route.ts",
    "app/api/notificacoes/route.ts",
    "app/api/calendario/route.ts",
    "app/api/dashboard/route.ts",
    "app/api/relatorios/route.ts",
    "app/api/relatorios/inadimplencia/route.ts",
    "app/api/search/route.ts",
    "app/api/alunos/[id]/pagamentos-em-aberto/route.ts",
    "app/api/pagamentos/meses-disponiveis/route.ts",
]

for rel in files:
    path = os.path.join(BASE, rel)
    if not os.path.exists(path):
        print(f"SKIP: {rel}")
        continue
    
    c = open(path).read()
    
    # Only inject if not already done
    if 'requireSchool' in c and 'const { schoolId }' not in c:
        c = inject_school_extraction(c)
    
    c = add_school_to_where(c)
    c = add_school_to_create(c)
    
    open(path, 'w').write(c)
    print(f"Patched: {rel}")

print("Done")
