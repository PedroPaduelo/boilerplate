-- Estende o enum UserRole com os 3 papéis adicionais do MVP
-- (ANALYST, CREATOR, VIEWER). Este split em migration dedicada é o
-- workaround necessário do PostgreSQL: novos valores de enum precisam
-- ser commitados em uma transação antes de poderem ser referenciados
-- (ex.: SET DEFAULT em outra migration). Veja o plano 30 para detalhes.
ALTER TYPE "UserRole" ADD VALUE 'ANALYST';
ALTER TYPE "UserRole" ADD VALUE 'CREATOR';
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';
