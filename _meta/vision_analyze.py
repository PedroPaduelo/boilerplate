import base64, json, os, urllib.request, time

key = os.environ["MM_KEY"]
OUT = "_meta/vision"
os.makedirs(OUT, exist_ok=True)

# ordem lógica do "relatório maduro"
IMAGES = [
    ("00-card-exemplo", "uploads/dwgsu-image.png"),
    ("01-funil-cobranca", "uploads/e1qo6-image.png"),
    ("02-rating-igr", "uploads/e2d9q-image.png"),
    ("03-parcelamentos-vigentes", "uploads/e2wk7-image.png"),
    ("04-inadimplencia-safra", "uploads/e32c9-image.png"),
    ("05-analise-transacao", "uploads/e3fg8-image.png"),
    ("06-devedores-criticos", "uploads/e3n2s-image.png"),
    ("07-top5-recomendacoes", "uploads/e3x89-image.png"),
    ("08-contribuintes-tabela", "uploads/e448w-image.png"),
]

PROMPT = (
    "Você é um analista sênior de UI/UX especializado em dashboards de BI e relatórios de dados. "
    "Analise a HIERARQUIA e a COMPOSIÇÃO VISUAL desta tela (foco no layout/shape, não apenas no conteúdo). "
    "Responda em pt-BR, ESTRUTURADO, cobrindo:\n"
    "1) HIERARQUIA / ANINHAMENTO: quais são as SEÇÕES de nível 1 (cards/painéis grandes com borda/fundo próprio) "
    "e o que está DENTRO de cada uma (sub-seções, sub-cards). Use indentação para mostrar o aninhamento.\n"
    "2) GRID: quantas colunas a tela usa em cada faixa horizontal (row), e a largura relativa de cada bloco (ex.: 4 KPIs lado a lado = 4 colunas de 3/12; um painel 8/12 + outro 4/12).\n"
    "3) COMPONENTES ELEMENTARES: liste cada tipo (KPI/stat card, gráfico de barras horizontal/vertical, donut, linha, tabela, título de seção, texto descritivo, badge/chip, alerta/callout, barra de progresso) e ONDE aparece.\n"
    "4) CABEÇALHO DE CADA CARD/SEÇÃO: tem título? subtítulo? badge no canto? ação (botão) no canto direito? rodapé?\n"
    "5) STORYTELLING: a ordem em que a informação é apresentada de cima para baixo (a 'narrativa' do relatório).\n"
    "6) PADRÃO DE ENCAPSULAMENTO: descreva o 'shell' visual recorrente dos cards (borda, raio, cor de fundo levemente diferente, header com divisória, etc.).\n"
    "Seja específico com números (ex.: '6 KPIs em uma linha', 'donut à esquerda 1/3 + tabela à direita 2/3')."
)

def analyze(path):
    b64 = base64.b64encode(open(path, "rb").read()).decode()
    payload = {
        "model": "MiniMax-Text-01",
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": PROMPT},
            {"type": "image_url", "image_url": {"url": "data:image/png;base64," + b64}},
        ]}],
        "max_tokens": 4000,
    }
    req = urllib.request.Request(
        "https://api.minimax.io/v1/text/chatcompletion_v2",
        data=json.dumps(payload).encode(),
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
    )
    d = json.loads(urllib.request.urlopen(req, timeout=240).read().decode())
    if d.get("base_resp", {}).get("status_code") != 0:
        return "ERRO: " + json.dumps(d.get("base_resp"))
    return d["choices"][0]["message"]["content"]

for name, path in IMAGES:
    t0 = time.time()
    try:
        text = analyze(path)
    except Exception as e:
        text = "EXCEPTION: " + repr(e)
    open(f"{OUT}/{name}.md", "w").write(text)
    print(f"[{name}] {len(text)} chars in {time.time()-t0:.1f}s", flush=True)

print("DONE", flush=True)
