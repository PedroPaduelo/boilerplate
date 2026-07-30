-- AlterTable
-- Relatórios EXTERNOS (legado): dashboards que só apontam para uma URL fora da
-- plataforma. NULL = dashboard montado aqui (comportamento atual, inalterado).
ALTER TABLE "dashboards" ADD COLUMN     "external_url" TEXT;
