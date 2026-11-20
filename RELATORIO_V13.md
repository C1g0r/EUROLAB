# EUROLAB v1.3 — Relatório de implementação

Data: 20 de novembro de 2026

## Objetivo
Comparar os cinco modos do gerador EUROLAB v1.2 sem consultar resultados futuros, sempre com o mesmo intervalo de datas e a mesma janela de treino para todos.

## Estado dos dados
- 1 999 concursos, de 13/02/2004 a 17/11/2026, sem novas atualizações.
- A comparação utiliza apenas o período desde 27/09/2016 (12 estrelas).
- Os seis arquivos originais e os relatórios das versões anteriores são preservados.

## Motor
- Função pura `EuroCompare.evaluate(draws, config, choose, makeRng)`, em `assets/comparacao-core.js`.
- Parâmetros: janelas 100/250/500, último período 120/250/500 concursos elegíveis, semente inteira 32-bit.
- As estratégias recebem apenas `era.slice(i-window, i)`; a data-alvo não entra no histórico da seleção.
- Modos reutilizados de `generateOne`: uniforme, frequências altas/baixas, equilibrado e anti-datas.
- Um fluxo PRNG independente por estratégia. Mesma amostra observada e tamanho de histórico.
- Exportação de relatório completo em JSON e chaves/scores por concurso em CSV.

## Indicadores
- Soma dos acertos de números e estrelas por método, e quantidades de concursos com 2+ ou 3+ números.
- Evolução temporal acumulada de `acertos_números - 0,5 × concursos`.
- Discriminação anual.
- Expectativa sob sorteio justo: 0,5 acertos principais e 1/3 acertos de estrelas por concurso.
- Bandas de referência a 95% **aproximadas** com variância hipergeométrica, não intervalos de vantagem e não corrigidas por seleção entre métodos ou múltiplas comparações.

## Testes
- Testes de cenário sintético do núcleo realizados antes da publicação.
- Ficheiro de regressão adicionado: `tests/comparacao.test.cjs`, para execução com Node.js.
- A UI por HTTP deve ser confirmada no Mac; esta atualização via GitHub não constitui teste ponta-a-ponta num navegador real.

## Limitações
- Não prova previsibilidade nem vantagem económica.
- O histórico foi usado para construir as estratégias; refazer as escolhas após ver o resultado gera sobreajuste.
- Não estima retornos financeiros nem altera probabilidades de uma chave simples.
- A autenticidade externa dos arquivos e a ligação máquina–bola–concurso continuam pendentes.
