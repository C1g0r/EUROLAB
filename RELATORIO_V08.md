# EUROLAB v0.8 — Auditoria das sequências FDJ e cronologia dos equipamentos

**Data de corte:** 20/11/2026, antes da extração desse dia. **Último concurso importado:** 17/11/2026.

## 1. Descoberta: duas representações nos seis CSV

Os arquivos FDJ fornecidos pelo utilizador contêm os campos `boule_1`, ..., `boule_5`, `etoile_1`, `etoile_2` e campos adicionais `boules_gagnantes_en_ordre_croissant` e `etoiles_gagnantes_en_ordre_croissant`. O importador anterior preservava apenas os conjuntos em ordem crescente; a v0.8 preserva ambas as representações. O facto de o próprio CSV fornecer separadamente a ordem crescente sugere que os campos numerados são uma sequência original diferente; **não foi encontrada confirmação documental explícita de que seja a ordem física efetiva de extração**. A aplicação identifica-os como `numbers_raw` e `stars_raw`, não como «ordem física verificada».

Auditoria completa, reproduzível com `python3 scripts/recover_order.py`:

- 1 999 resultados com sequências completas nas colunas numeradas.
- 1 981 sequências de cinco números não estão em ordem crescente.
- 1 004 pares de estrelas não estão em ordem crescente.
- Zero discrepâncias de conjunto entre os campos numerados e os campos «en ordre croissant».
- Zero divergências dos conjuntos com a base estruturada v0.7.
- Cada resultado inclui `source_archive` e `source_csv_row` para inspecionar diretamente o CSV original.

**Exemplo real do arquivo 2020–2026:** em 17/11/2026, campos numerados 48, 35, 37, 38, 46; estrelas 2, 1. Campos crescentes 35, 37, 38, 46, 48; estrelas 1, 2. A existência de uma sequência não ordenada não permite, por si, atribuir uma máquina específica.

Os arquivos ZIP originais foram incluídos em `fontes/originais/`. Os respetivos hashes SHA-256 estão em `data/auditoria-ordens-v08.json`. Apesar de a página da FDJ oferecer arquivos com os mesmos nomes e períodos, não foi possível descarregar uma segunda cópia independente para confrontar hashes.

Fonte: https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/historique

## 2. Teste científico de posições

**Hipótese nula condicional:** dadas as combinações efetivamente registadas em cada sorteio, as posições de saída nos campos numerados são permutações igualmente prováveis, isto é, os números daquele sorteio podem ocupar qualquer posição sem preferência. Trata-se de uma hipótese sobre a **ordenação dos campos na fonte**, não de um teste completo da equidade física.

Para cada teste, contamos quantas vezes cada número ocupa cada posição. A contagem esperada por posição é a frequência total do número na população dividida pelo número de posições (cinco para números, duas para estrelas). O estatístico global é a soma de desvios quadráticos normalizados por essa expectativa. Para calibrá-lo:

1. Mantemos as combinações de números e estrelas exatamente como estavam no arquivo;
2. Embaralhamos uniformemente a sua ordem dentro de cada sorteio;
3. Repetimos 2 500 vezes com semente 20261120 para os números e sementes derivadas para cada regime de estrelas;
4. Calculamos o valor-p Monte Carlo com correção `(extremos+1)/(simulações+1)`;
5. Corrigimos os quatro valores-p globais com Holm-Bonferroni. Não atribuímos significância às células individualmente destacadas.

| Teste global | Concursos | Estatístico | p Monte Carlo | p Holm |
|---|---:|---:|---:|---:|
| Números 2004–2026 | 1 999 | 178,285 | 0,875250 | 1,000000 |
| Estrelas 2004–2011 | 378 | 10,226 | 0,334666 | 1,000000 |
| Estrelas 2011–2016 | 562 | 8,464 | 0,651339 | 1,000000 |
| Estrelas 2016–2026 | 1 059 | 8,688 | 0,716913 | 1,000000 |

**Conclusão:** nenhum dos quatro testes globais rejeitou a hipótese de permutabilidade de posições ao nível de 5%. Isto não prova a ausência de qualquer viés nem capacidade de previsão. Reproduzir: `python3 scripts/order_lab.py --simulations 2500` (biblioteca padrão).

## 3. Investigação das máquinas — o que está realmente comprovado

### Observações históricas

- **2010, reportagem presencial:** duas máquinas, 50 bolas principais e nove estrelas; bolas descritas como borracha; inspeções semestrais de massa, diâmetro e ressalto; referência histórica a alternância de conjuntos aproximadamente mensal. Fontes: https://www.leparisien.fr/archives/les-secrets-du-tirage-05-02-2010-804292.php
- **7 de fevereiro de 2020:** reportagem presencial publicada em 9/2 descreve máquinas de reserva, conjuntos de bolas alternados, mala selada, identificação gravada e verificações de amostras. Não divulga quais os números de série usados em cada concurso. Fonte: https://www.dna.fr/culture-loisirs/2020/02/09/dans-les-coulisses-d-euromillions
- **2025, FDJ:** informação oficial sobre ensaios com bolas de teste, cofre, selo e fiscalização. Fonte: https://www.fdj.fr/mag/coulisses/article-coulisses-tirage-euromillions

### Mudanças nas regras, não confundir com substituição de máquinas

- **10/05/2011:** transição para 11 estrelas e novos sorteios de terça-feira. Não identifica uma mudança de série de máquina.
- **27/09/2016:** transição para 12 estrelas. Não identifica troca de máquina.
- **12/05/2020:** autorização normativa francesa para meios de extração informáticos ou mecânicos, sob fiscalização. Não comprova uso de um método informático em qualquer concurso concreto. Fonte: https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000041865593

### Modelos candidatos, sem vínculo comprovado a um sorteio

- Ryo-Catteau **Stresa**: esfera de 700 mm, dupla rotação inversa. Fonte: https://www.ryo-catteau.com/en/stresa.htm
- Ryo-Catteau **Pâquerette**: mistura com pás, modelo comercial para bolas de 40 mm. Fonte: https://www.ryo-catteau.com/en/paquerette.htm

As especificações de catálogo **não** demonstram que a máquina usada no sorteio do Euromilhões desse dia era desse modelo ou que as bolas oficiais atuais tinham tais dimensões.

### Conclusão da rastreabilidade

**Substituições de equipamento verificadas por data e número de série: zero.** Não existem dados suficientes para um teste causal antes/depois de uma mudança de máquina. O catálogo e os eventos cronológicos estão em `data/linha-temporal-equipamentos-v08.json`.

## 4. Fontes audiovisuais localizadas (não revistas quadro a quadro)

Foram identificadas sete entradas com vídeos oficiais ou páginas de replay: 04/02/2020, 11/05/2021, 06/02/2026, 08/09/2026, 11/09/2026, 13/11/2026 e 17/11/2026. A última é apenas uma página de replay de terceiro, sem URL YouTube direta confirmada.

- Fonte da hora do sorteio (aprox. 21h05 em França) versus transmissão (aprox. 21h50): https://www.fdj.fr/mag/questions/euromillions-my-million-heure
- Lista de URLs, qualificações e estado da revisão: `data/catalogo-videos-v08.json`
- Não atribuir qualquer sequência real a um vídeo enquanto não for verificada a presença de todas as extrações, continuidade e data.

## 5. Como abrir e reproduzir

Da pasta `EUROLAB`:

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080`, seleciona **Posições & máquinas · v0.8**. A aplicação não precisa de redes externas para carregar os dados e gráficos. Ligações a vídeos e fontes externas exigem acesso à Internet.

Para auditar e recalcular os campos originais a partir dos arquivos incluídos:

```bash
python3 scripts/recover_order.py
python3 scripts/order_lab.py --input data/dados-validados.json --output data/analise-posicoes-v08.json --simulations 2500
```

A importação genérica `importar_fdj.py` também passou a guardar as colunas originais, mas os scripts acima fornecem verificação cruzada adicional com os campos crescentes dos seis arquivos desta versão.

## 6. Limites da investigação

Este projeto não identifica massas, diâmetros, materiais precisos em 2026, séries, conjuntos de bolas ou condições ambientais para cada data. Nenhum vídeo foi descarregado, revisto quadro a quadro nem transcrito como extração integral nesta fase. O programa não promete previsão de números nem vantagem de jogo. Dados e fontes devem ser tratados como evidências de diferentes níveis de certeza.
