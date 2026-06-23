# 04 — Dashboard (render, filtros, execução)

> Status: ESQUELETO (aguardando respostas)

## O que o usuário disse
- Tela "hidratada": layout de dashboard.
- Topo: **filtros**. Corpo dividido em **linhas (seções)**; dentro das linhas, os gráficos.
- Um filtro do topo pode se aplicar a **um gráfico e não a outro** (mapeamento seletivo).
- Na abertura do dashboard, os gráficos lançam na tela e as **queries são executadas**.
- Para não travar banco/layout: rodar em **fila** e atualizar via **socket** (a decidir).
- **TTL de cache é por gráfico** (não por dashboard): tem gráfico tempo-real, outro não.

## Decisões em aberto
- [ ] Modelo de filtros: tipos (data, select, range, busca), valores, defaults.
- [ ] Como o filtro parametriza a query de cada gráfico (binding).
- [ ] Estratégia de execução: fila por dashboard? por gráfico? prioridade?
- [ ] Eventos de socket: granularidade (por gráfico), payload, sala por usuário.
- [ ] Loading/skeleton e estados de erro por gráfico.
