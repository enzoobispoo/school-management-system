-- Custom PostgreSQL enum value (Prisma migrate cannot always diff enum additions cleanly).
ALTER TYPE "UserRole" ADD VALUE 'SECRETARIA_FINANCEIRA';
