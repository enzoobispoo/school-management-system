-- Exemplo: promover usuários da secretaria acadêmica para secretaria com painel financeiro.
-- Ajuste o e-mail ou o id antes de executar. Rode em ambiente controlado / backup.

-- Por e-mail (um usuário):
-- UPDATE "User"
-- SET role = 'SECRETARIA_FINANCEIRA'
-- WHERE email = 'secretaria@escola.edu.br';

-- Por escola + papel atual:
-- UPDATE "User"
-- SET role = 'SECRETARIA_FINANCEIRA'
-- WHERE "schoolId" = 'SEU_SCHOOL_ID_UUID'
--   AND role = 'SECRETARIA';
