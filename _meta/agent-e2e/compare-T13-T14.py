#!/usr/bin/env python3
import re, json

def parse(path):
    text = open(path).read()
    events = re.findall(r'event: (\w+)\ndata: (.+)', text)
    full = ''
    for ev, data in events:
        try:
            d = json.loads(data)
            if ev == 'text_delta':
                full += d.get('delta', '')
        except:
            pass
    return full

def metrics(label, full):
    print('===', label, '===')
    print(f'  Tamanho: {len(full)} chars, {len(full.split())} palavras')
    print(f'  Tem "TL;DR": {"TL;DR" in full}')
    print(f'  Tem "Insight": {"Insight" in full}')
    bus_words = ['R$', 'mil', 'bilhão', 'bi', 'estoque', 'inadimplência', 'parcelamento', 'dívida', 'campanha', 'arrecadação', 'cobrança']
    has_business = sum(1 for w in bus_words if w.lower() in full.lower())
    print(f'  Termos de negocio: {has_business}/11')
    last = full[-1500:]
    print(f'  "Quer" no final: {("Quer" in last) or ("quer" in last)}')
    print(f'  "Posso" no final: {("Posso" in last) or ("posso" in last)}')
    print(f'  "Me diga" no final: {("Me diga" in last) or ("me diga" in last)}')
    first_300 = full[:300]
    meta = ['O gatilho', 'vou ativar', 'mapeia direto', 'deixa eu ativar', 'Vou puxar', 'Antes de responder diretamente']
    has_meta = [p for p in meta if p in first_300]
    print(f'  Meta-linguagem no inicio: {has_meta if has_meta else "NAO"}')
    n_bold = full.count('**') // 2
    print(f'  Pares de ** (bold): {n_bold}')
    bold_nums = re.findall(r'\*\*[^*]*(?:R\$|%|mil|bi)[^*]*\*\*', full)
    print(f'  Numeros em destaque: {len(bold_nums)}')
    n_bullets = len(re.findall(r'^\s*[-*]\s', full, re.MULTILINE))
    print(f'  Bullets: {n_bullets}')
    n_tables = full.count('\n|---')
    print(f'  Tabelas markdown: {n_tables}')
    print(f'  Primeiros 250 chars:')
    print(f'    {repr(full[:250])}')
    print()

t13 = parse('/workspace/_meta/agent-e2e/test-T13-ton.stream')
metrics('T13 (ANTES)', t13)
print('=' * 60)
print()
t14 = parse('/workspace/_meta/agent-e2e/test-T14-system-applied.stream')
metrics('T14 (DEPOIS)', t14)
