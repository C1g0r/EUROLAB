# EUROLAB v1.1 — Validação cronológica dos cinco métodos e gestão de chaves

**Referência:** 20/11/2026, antes do sorteio do dia. Dados históricos disponíveis até 17/11/2026. Não houve atualização de resultados além dessa data.

## Objetivo

Não confundir a seleção estética/histórica com uma capacidade real de prever sorteios. A v1.1 acrescenta uma avaliação retrospetiva de **cada um dos cinco métodos reais do gerador**, em vez de tentar extrapolar os resultados do antigo teste de «números quentes nos 100 sorteios anteriores».

## Protocolo reproduzível

1. Selecionar os **1 059** sorteios desde 27/09/2016 (regime de 12 estrelas), por ordem crescente.
2. Para cada concurso a partir do 101.º (janela 100), usar apenas os 100 sorteios imediatamente anteriores. Para janela 250, usar os 250 anteriores. Não existe fuga de informação do concurso avaliado para a seleção.
3. Testar os modos Aleatório uniforme, Frequências altas, Frequências inversas, Equilibrado e Anti-datas. Para cada modo e data histórica, amostrar uma chave 5+2 segundo os pesos e filtros definidos na aplicação. Utilizar PRNG mulberry32 com semente fixa para tornar o teste repetível.
4. Somar os acertos individuais de 5 números e 2 estrelas e os concursos com pelo menos 2 ou 3 números acertados. Não reduzir os resultados a um suposto «ranking de previsibilidade».
5. Referência para uma chave em sorteio justo: números esperados = `5*5/50 = 0,5`; estrelas esperadas = `2*2/12 = 1/3`. Com 959 avaliações, médias teóricas de **479,5 números** e **319,67 estrelas**. Não inferir rentabilidade a partir de acertos individuais.

Com a semente padrão **20261120** e janela **100**, a validação funcional no Chromium devolveu:

| Método | Números acertados | Estrelas acertadas |
|---|---:|---:|
| Aleatório uniforme | 514 | 324 |
| Frequências altas | 488 | 332 |
| Frequências inversas | 475 | 336 |
| Equilibrado | 490 | 328 |
| Anti-datas | 492 | 300 |

Estes são resultados de **uma realização pseudoaleatória por método**, não estimativas rigorosas da vantagem nem resultados de um estudo prospetivo. Uma pontuação melhor que a expectativa não é evidência de previsibilidade, especialmente após explorar vários métodos ou sementes. É possível gerar diferentes pontuações alterando a semente. O teste não procura novas regras ótimas, nem valida a mecânica física das bolas.

## Módulo Cofre e diversificação

O cofre guarda até 100 chaves distintas em `localStorage`. Permite adicionar/remover e importar/exportar. O gerador tem uma opção para reduzir **heuristicamente** a sobreposição dos números e estrelas entre chaves do mesmo lote, sem penalizar a primeira. Este recurso modifica a distribuição de seleção dos boletins subsequentes, mas não a distribuição do sorteio; para **k** chaves distintas, a probabilidade de jackpot conjunto continua a ser `k / 139 838 160` se o sorteio for uniforme.

O Cofre está associado ao endereço `127.0.0.1:8765` e ao perfil do navegador. Limpar dados de navegação, mudar de perfil ou abrir noutra origem pode perder o armazenamento. Exportar JSON é a cópia recomendada. Não se guardam credenciais, números de conta nem informação de apostas.

## Validações de software

- Sintaxe de `assets/app.js` verificada com Node (`node --check`) no ambiente de construção. **O utilizador não precisa de Node** para executar a app.
- Testes de interface Chromium: 5 métodos × 10 chaves válidas, modo diversificado, cofre (guardar, acrescentar manualmente, remover, exportar), teste com janelas 100/250, repetição com a mesma semente (resultado idêntico), exportação JSON, histórico e estatísticas anteriores, layout móvel sem scroll horizontal.
- As verificações confirmam as funções testadas, não a inexistência de todos os defeitos nem a autenticidade dos dados originais.
