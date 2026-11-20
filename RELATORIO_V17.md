# EUROLAB v1.7 — Seletor estatístico da Chave 1

Data de implementação: 20/11/2026.

## Objetivo
A Chave 1 deixa de estar associada permanentemente às frequências altas. Passa a ser gerada pelo método com a melhor pontuação histórica observada numa comparação cronológica reproduzível.

A Chave 2 permanece dependente do modelo experimental Crowd Intelligence v1.4, que tem objetivo estatístico diferente (estudar padrões agregados de preferências de números de calendário).

## Métodos em comparação
- Aleatório uniforme: todos os números e estrelas com o mesmo peso.
- Frequências altas: pesos 1 a 5 proporcionais às frequências nos 250 concursos anteriores.
- Frequências baixas: inverso dos pesos de frequências altas.
- Equilibrado: amostragem uniforme com restrições de paridade (2/3 ímpares), amplitude (>= 20) e décadas (>= 3), com salvaguarda após 700 tentativas.
- Anti-datas: pesos 0,6 nos números 1–31 e 2,8 nos números 32–50; preferência obrigatória por pelo menos três números >31, com salvaguarda após 700 tentativas.

Os métodos são implementados em `assets/duas-chaves-core.js`, função `generateMode`, e partilhados entre o benchmark e a geração real.

## Protocolo de avaliação
- Regime histórico: 12 estrelas (desde 27/09/2016).
- Concursos avaliados: 250 concursos cronologicamente mais recentes.
- Para cada concurso: janela dos 250 concursos anteriores, sem dados do próprio sorteio alvo.
- Simulações: 5 sementes fixas iguais em número para todos os métodos; 1 chave por concurso e por semente.
- Total: 1 250 chaves históricas avaliadas por método.
- Pontuação: acertos de números + 0,5 × acertos de estrelas; média por chave testada.
- Critério: maior pontuação observada; empates resolvidos por ordem determinística.
- Referência teórica para sorteio justo: 0,5 + 0,5 × (1/3) = 0,6666667.

## Resultado inicial com histórico até 17/11/2026
| Método | Pontuação média |
|---|---:|
| Anti-datas | 0,6980 |
| Frequências altas | 0,6800 |
| Equilibrado | 0,6584 |
| Aleatório uniforme | 0,6468 |
| Frequências baixas | 0,6424 |

O vencedor inicial é **Anti-datas**. Este ranking é recalculado na abertura da aplicação quando o histórico recebido é diferente, e a classificação pode mudar. Enquanto o histórico e os critérios de avaliação forem iguais, o mesmo método continuará selecionado.

## Limitações fundamentais
1. A classificação otimiza o desempenho **observado** no histórico, não uma verdadeira capacidade de previsão confirmada.
2. Vários candidatos testados e a escolha do maior resultado introduzem viés de seleção. O valor do vencedor é uma estimativa potencialmente otimista.
3. Cinco sementes fixas reduzem a dependência de uma única chave simulada, mas não fornecem cinco conjuntos independentes de sorteios.
4. A métrica de acertos ponderados é uma métrica de investigação: não traduz diretamente valor de prémios, lucro, risco financeiro ou probabilidade de jackpot.
5. Para cada chave simples, sob sorteio justo, a probabilidade de jackpot permanece 1/139 838 160, independentemente do modelo.
6. A futura demonstração de vantagem exigiria testes prospetivos pré-registados, avaliações robustas e correção de múltiplos testes.

## Implementação e controlo
- `assets/selecao-core.js`: avaliação pura e determinística em cronologia.
- `assets/duas-chaves-core.js`: cinco métodos, cálculo da Chave 1, combinação com Crowd.
- `assets/duas-chaves.js`: carrega dados, avalia, mostra classificação, guarda identificação da versão do modelo.
- `index.html`: duas chaves e quadro expandível de avaliação.
- `tests/duas-chaves.test.cjs`: reprodução determinística, integridade histórica, rejeição de dados em falta e validação de pares.
- `.github/workflows/validar-eurolab.yml`: verificação automática de sintaxe e testes.

A Chave 2 permanece separada desta classificação por ter um objetivo científico diferente: um indicador agregado de padrões de escolha, não de acertos futuros.
