# EUROLAB v1.3 — Investigação, geração e comparação de estratégias

Aplicação web **local**, em português de Portugal, que reúne o histórico de **1 999 sorteios** (13/02/2004 a 17/11/2026) dos seis arquivos ZIP fornecidos pelo utilizador. **Não** inclui o sorteio de 20/11/2026 e **não** se atualiza automaticamente.

## Iniciar no Mac

1. Descompactar este ZIP na pasta Downloads.
2. Abrir a pasta `EUROLAB` e fazer duplo clique em `INICIAR-EUROLAB.command`.
3. Abrir `http://127.0.0.1:8765` se o Chrome/Safari não abrir automaticamente.
4. Manter o Terminal aberto enquanto utilizas o projeto; terminar com `Control+C`.

Se o macOS bloquear o atalho: no Terminal escrever `bash ` (incluindo espaço), arrastar o ficheiro `.command` para a janela e premir Enter. **Não** executar `python3 -m http.server` na pasta pessoal (`~`), porque o servidor tem de iniciar na pasta que contém `index.html`.

Se a porta 8765 estiver ocupada por uma versão anterior, fecha o respetivo Terminal e volta a executar o atalho. A porta fixa é importante para preservar o Cofre e as configurações guardadas no navegador.

## Novidades da v1.3

- **Comparar estratégias:** cinco métodos do gerador avaliados no mesmo conjunto de concursos, com janelas cronológicas de 100, 250 ou 500 sorteios, avaliação dos últimos 120, 250 ou 500 concursos elegíveis, semente reproduzível, tabela de acertos, evolução acumulada e comparação por ano.
- **Exportações:** relatório JSON detalhado e CSV com cada chave gerada para cada sorteio avaliado.
- **Referência teórica:** 0,5 acertos de números e 1/3 de acertos de estrelas por chave em sorteios independentes e justos; bandas de referência normais aproximadas a 95%, sem correção para seleção entre estratégias.
- **Testes de regressão:** `node tests/comparacao.test.cjs` para verificar janelas, valores esperados, rejeição de chaves inválidas e reprodutibilidade.

Os resultados são **exploratórios**. Selecionar a estratégia aparentemente melhor depois de ver o histórico não constitui demonstração preditiva. O período mais recente ainda é 17/11/2026, e os dados não se atualizam automaticamente.

## Principais módulos

- Visão geral: sorteios, histórico e frequências.
- Gerador: cinco modos de seleção, exportação CSV, diversificação de chaves.
- Cofre: até 100 chaves distintas guardadas no navegador, exportação/importação JSON.
- Validação: teste cronológico dos cinco modos da aplicação anterior.
- **Comparar estratégias (v1.3):** avaliação comparável dos cinco métodos, gráfico acumulado, resultados por ano e exportação.
- **Estratégia personalizada (novo v1.2):** pesos de frequências de números e estrelas, filtros de paridade, soma e anti-datas, exclusões de números, cinco predefinições, geração de chaves e armazenamento de configuração.
- **Teste personalizado (novo v1.2):** avaliação dos últimos 120/250/500 sorteios no regime atual, usando janela cronológica anterior de 100/250 sorteios, uma chave por concurso, semente reprodutível, comparação descritiva com 500 amostras aleatórias e exportação JSON por concurso.
- Máquinas & evidências: documentação e **diário local de observações**, com data, máquina, conjunto, URL e notas, exportável em JSON. Entradas do diário **não são verificadas**.
- Qualidade dos dados: alertas, incluindo as contagens europeias inconsistentes do sorteio de 31/01/2020.
- Laboratório antigo: `laboratorio-avancado.html`, preservado.

## Fontes, histórico e limitações

- Os seis ZIP originais estão preservados em `fontes/originais`. Os hashes SHA-256 verificam integridade local mas não autenticidade face aos servidores da FDJ.
- `data/dados-validados.json` mantém resultados, datas e sequências originais dos campos. A sequência não é certificação oficial da **ordem física**.
- Houve três regimes das estrelas; a estratégia personalizada usa apenas a era de **12 estrelas**, desde 27/09/2016, para evitar misturar denominadores.
- O catálogo de identificadores de máquinas possui quatro exemplos de fonte secundária, sem confirmação oficial de número de série ou lote.
- A comparação das estratégias com simulações é **exploratória**. A banda de referência condiciona nas chaves previstas e não recalcula o modelo em histórias alternativas; não constitui um valor-p confirmatório. A escolha ou alteração dos parâmetros após ver os resultados é sobreajuste.
- **Nenhuma estratégia demonstrou vantagem preditiva.** Em sorteio uniforme, cada chave específica tem probabilidade `1 em 139 838 160` de jackpot.
- O Cofre, a estratégia e o diário são guardados via `localStorage`. Não há login nem sincronização. Exporta cópias JSON. Não se fazem apostas nem são enviados dados a servidores externos pela app local.

Relatórios técnicos: `RELATORIO_V12.md` e `RELATORIO_V13.md`. Sem dependências externas, sem npm e sem Homebrew.


## Código-fonte e atualizações no GitHub

Ver [`GUIA-GITHUB.md`](GUIA-GITHUB.md) para publicar este projeto no repositório privado `C1g0r/EUROLAB`, executar testes de integridade e enviar as próximas alterações. O projeto inclui histórico de commits, tag `v1.2.0` e workflow de validação.


## Verificar a versão 1.3

```bash
node --check assets/comparacao-core.js
node --check assets/comparacao.js
node tests/comparacao.test.cjs
python3 tests/verificar_dados.py
```

A publicação no GitHub foi efetuada no repositório privado `C1g0r/EUROLAB`. A aplicação continua local, via `INICIAR-EUROLAB.command` e `http://127.0.0.1:8765`; ainda não está publicada em GitHub Pages.
