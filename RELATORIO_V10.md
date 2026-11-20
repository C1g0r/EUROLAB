# EUROLAB v1.0 — Nota de investigação e catálogo técnico

Data de referência: 20-11-2026 · Histórico importado até 17-11-2026.

## 1. Estado dos dados

- Seis ZIP fornecidos pelo utilizador com proveniência FDJ declarada: 1 999 resultados de 2004–2026, zero datas duplicadas e zero rejeições estruturais.
- Três regimes de estrelas, validados contra os limites vigentes: 378 sorteios de 2004 a maio de 2011 (1–9), 562 de maio de 2011 a setembro de 2016 (1–11) e 1 059 a partir de setembro de 2016 (1–12).
- O sorteio de 20-11-2026 não foi incluído: o arquivo entregue termina em 17-11-2026.
- Em 31-01-2020, o arquivo fornecido contém 12 campos de vencedores europeus iguais a zero apesar de contar vencedores franceses; os campos não são fiáveis para comparações financeiras. Mantêm-se os valores brutos para auditoria.
- O histórico «ordenado» e as colunas originais dos CSV são preservados para a análise de ordem de extração, sem pressupor que esta correspondência esteja formalmente certificada.

## 2. Processamento e testes

A web app v1.0 utiliza a base JSON validada. Integra os relatórios produzidos nas versões 0.3–0.9: testes de uniformidade de frequências condicionais ao regime, comparações com simulações Monte Carlo, correção Holm, séries temporais, retrospetiva de 1 699 sorteios, comparação entre dias da semana, repetições e posições originais.

Nenhum desses testes revelou vantagem preditiva demonstrada depois de considerar incerteza e multiplicidade. O gerador v1.0 oferece maneiras exploratórias de selecionar números; não é um modelo de previsão do sistema físico.

## 3. Evidências físicas documentadas

### Confirmado por operador

- FDJ (2025): descrição de ensaios técnicos (por volta das 18h15), guarda dos conjuntos oficiais em cofre/mala selada, intervenção do comissário de justiça, sorteio de cinco entre 50 e duas estrelas entre 12, registo do resultado após a extração. Fonte: https://www.fdj.fr/mag/coulisses/article-coulisses-tirage-euromillions
- FDJ: seis arquivos históricos em ZIP até novembro de 2026. Fonte: https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/historique

### Informação técnica de catálogo, NÃO confirmada como equipamento EuroMillions em 2026

- Ryo-Catteau Stresa: esfera de 700 mm e mistura por dupla rotação inversa. Fonte: https://www.ryo-catteau.com/en/stresa.htm
- Ryo-Catteau Pâquerette: equipamento para uma ou duas extrações suplementares, bolas de 40 mm no catálogo. Fonte: https://www.ryo-catteau.com/en/paquerette.htm
- FDJ UNITED 2026: artigo sobre fornecedor e bolas de 50 mm/cerca de 25 g em contexto LOTO. NÃO transpor para bolas EuroMillions sem confirmação. Fonte: https://www.fdjunited.com/fr/2026/09/ryo-catteau-dans-les-coulisses-dun-partenaire-historique-des-jeux-de-tirages/

### Identificadores secundários por concurso

- 13/02/2004: Machine 1, bolas E1 (nomenclatura histórica).
- 16/09/2016: máquina 3, conjunto 4.
- 31/01/2020: máquina 1, conjunto 19.
- 17/11/2026: máquina 13, conjunto 21. Na mesma página, a fonte independente publica a sequência física 48,35,37,38,46 e estrelas 2,1, coincidente com os campos originais do CSV para este concurso.
- Origem independente: https://www.euro-millions.com/results/17-11-2026 ; detalhes e URLs por concurso no ficheiro `data/maquinas-external-v09.json`.
- Ainda não se conhece a correspondência certificada entre estes rótulos e os números de série ou lotes físicos. Não se inferiu o desempenho de máquinas a partir de 4 exemplos.

## 4. Próximas perguntas de investigação

1. Existe um arquivo público, por concurso, que identifique máquina, conjunto, composição, massa e tolerâncias?
2. Qual a semântica certificada das colunas `boule_1` a `boule_5` e `etoile_1` a `etoile_2` em cada período?
3. São acessíveis relatórios de ensaio, calibração ou auditoria das máquinas?
4. Existem gravações contínuas com confirmação do conjunto usado, passíveis de verificação independente?
5. Antes de testar uma nova hipótese estatística, é possível formular critérios prévios e separar treino de validação futura?

## 5. Probabilidade e gerador

Para o formato corrente: C(50,5) × C(12,2) = 139 838 160 combinações distintas. Num sorteio equitativo e independente, cada chave tem probabilidade 1/139 838 160 de corresponder ao jackpot, independentemente de ter sido criada aleatoriamente ou de ter sido selecionada a partir de frequências. Técnicas de seleção humana podem afetar a eventual partilha de prémios, mas sem dados de vendas não é possível quantificar esse fenómeno.

Fontes das probabilidades e regras:
- https://www.lottery.ie/game-information/euromillions
- https://www.euro-millions.com/odds-of-winning

---
A base integrada não é uma auditoria de segurança das operações nem permite concluir que o sorteio possa ser previsto. O objetivo científico é documentação rigorosa, metodologia transparente e testes de hipóteses reprodutíveis.
