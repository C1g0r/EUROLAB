# EUROLAB — Laboratório Independente do Euromilhões (v0.8)

**Referência temporal:** 20 de novembro de 2026 (antes do sorteio dessa noite).

## Estado real da recolha — atualizado após receção dos arquivos

- **Seis arquivos ZIP fornecidos e processados**, com origem declarada FDJ; integridade de download original não verificada independentemente.
- **1 999 sorteios únicos** de 13/02/2004 a 17/11/2026, com 0 registos rejeitados, 0 duplicados e 0 conflitos.
- **92 sorteios em 2026** até 17/11/2026. O sorteio de 20/11/2026 ainda não consta dos arquivos enviados.
- **0 datas em falta** segundo o calendário de sextas até 06/05/2011 e terças+sextas a partir de 10/05/2011, até 17/11/2026.
- A pasta `data/` contém JSON pronto para a aplicação, CSV normalizado e relatório de validação.
- Esta validação comprova a **consistência interna** dos arquivos, não a sua autenticidade contra servidores FDJ nem o resultado audiovisual original.

## Como instalar — macOS (sem dependências)

1. **Opcional para refazer a importação:** descarregue os seis ZIP de https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/historique
2. Os seis ZIP já se encontram incluídos na pasta `fontes/originais/` (ou guarde versões atualizadas em `arquivos/`).
3. No Terminal, entre na pasta do projeto, e execute:

   ```bash
   python3 importar_fdj.py fontes/originais/*.zip
   ```

4. Examine `data/relatorio-validacao.json` e corrija quaisquer problemas de cabeçalho ou conflito. A importação pode devolver erro se os CSV não corresponderem ao esquema suportado; nesse caso, não implica que o arquivo oficial seja inválido.
5. Para abrir o painel com os 1 999 sorteios já incluídos, sirva a pasta localmente:

   ```bash
   python3 -m http.server 8080
   ```

6. Visite http://localhost:8080. Alternativamente, abra `index.html` e escolha **Importar JSON validado** para importar o JSON manualmente.

## Controlo de qualidade

- Aceita apenas resultados de 13/02/2004 a 20/11/2026.
- Verifica 5 números distintos em 1–50 e 2 estrelas distintas no intervalo aplicável ao dia do sorteio.
- Valida datas e reporta duplicados e datas conflitantes.
- Conserva agora dois formatos: `numbers`/`stars` em ordem crescente e `numbers_raw`/`stars_raw` na sequência original dos campos `boule_1..5` e `etoile_1..2`. **A associação desta sequência à ordem física de saída ainda carece de verificação externa.**
- **Não** valida a genuinidade do arquivo descarregado: é preciso descarregar diretamente da FDJ e comparar amostras com Jogos Santa Casa.
- A análise de estrelas deve separar regimes (1–9, 1–11, 1–12) para evitar vieses estatísticos.

## Documentação técnica

**Fontes primárias:**

- FDJ: https://www.fdj.fr/mag/coulisses/article-coulisses-tirage-euromillions
  - Ensaios técnicos, bolas de teste distintas, mala lacrada/cofre, fiscalização, dois conjuntos de extração (50 + 12).
- FDJ: https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/historique
  - Arquivos oficiais, divididos em seis ZIP.
- FDJ UNITED: https://www.fdjunited.com/fr/2026/09/dans-les-coulisses-des-studios-fdj-united-lenvers-du-decor-du-loto/
  - Operações dos estúdios em 2026; não extrapolar todos os tempos do LOTO para o Euromilhões.
- Jogos Santa Casa: https://www.jogossantacasa.pt/web/SCInstitucional/verDetalhe?contentId=44
  - Regulamentação portuguesa.

**Linhas por investigar:** fabricante/modelo **atual**, materiais, diâmetro e massa das bolas do Euromilhões, tolerâncias, inspeção de conjuntos, rotações, condições climáticas e trocas de equipamentos.

## Nota metodológica

A frequência de números num sistema aleatório independente não permite predizer o sorteio seguinte. A seleção de hipóteses e testes exige correção para comparações múltiplas e validação fora da amostra. Não é uma ferramenta para recomendar apostas.


## EUROLAB v0.3 — testes científicos

Foi adicionada a secção **Testes científicos**, carregada a partir de `data/analise-estatistica.json`. Compara os três regimes de estrelas e executa testes de uniformidade por Monte Carlo (1 000 simulações por caso) a partir dos 1 999 sorteios estruturados. Não confundir o valor-p de Pearson assintótico com o valor-p Monte Carlo: as bolas são extraídas sem reposição dentro de cada sorteio, pelo que a simulação é mais apropriada. Resultados exploratórios não corrigidos para múltiplas comparações, sem alegação de previsibilidade.

Para reproduzir a análise, estão incluídos `scripts/analise_base.py` e `scripts/montecarlo.py` (requerem Python 3 e os módulos `numpy`, `scipy`). A partir da v0.8, os seis arquivos ZIP originais fornecidos pelo utilizador estão incluídos em `fontes/originais/`, com hashes SHA-256 em `data/auditoria-ordens-v08.json`.

## Fontes técnicas

- FDJ, bastidores do sorteio: https://www.fdj.fr/mag/coulisses/article-coulisses-tirage-euromillions
- Ryo-Catteau, Stresa: https://www.ryo-catteau.com/en/stresa.htm
- Ryo-Catteau, Pâquerette: https://www.ryo-catteau.com/en/paquerette.htm
- Legifrance, regulamento: https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000033080085

A documentação sobre equipamentos é descrita como fonte do fabricante, não como prova de que determinada máquina está operacionalmente instalada em 2026.


## EUROLAB v0.4 — evidência física e interpretação estatística

- Nova secção **Evidências e máquinas**, com sete referências e classificação da força da evidência.
- Novo relatório `data/correcao-multiplos-testes.json`: ajuste de Holm-Bonferroni dos sete testes de frequências exploratórios da v0.3. A família de testes é uma escolha parcial e não abrange toda a exploração realizada.
- `data/fontes-tecnicas.json`: ficha de documentação auditável com URLs.
- `data/manifesto-integridade.json`: hashes SHA-256 dos ficheiros JSON locais, para detetar alterações futuras (não valida proveniência externa).
- **Distinção crucial:** a ficha FDJ de 2026 refere bolas de 50 mm e cerca de 25 g no contexto do LOTO e de Ryo-Catteau, sem confirmar que essa seja a especificação das bolas EuroMillions. A máquina Pâquerette pode aceitar bolas de 40 mm, mas a configuração EuroMillions atual não foi diretamente atestada.
- Nenhum relatório público encontrado liga cada sorteio ao número de série da máquina, lote de bolas, massa ou temperatura; por isso não existe comparação causal possível entre equipamento e frequência dos números nesta fase.


## EUROLAB v0.5 — protocolo de auditoria de vídeos

- Nova tab **Auditoria de vídeos**; permite registar data, URL, tipo, transcrição da ordem das bolas e estrelas, observações e grau de confiança.
- O registo compara automaticamente o **conjunto** transcrito com os resultados históricos importados; não determina por computador se o vídeo é autêntico, contínuo ou se a ordem foi corretamente transcrita.
- As transcrições e observações são guardadas apenas em `localStorage` do navegador; exporta JSON para conservação.
- Contagem inicial: **zero** ordens físicas verificadas por vídeo; 1 999 resultados CSV validados estruturalmente.
- Novo protocolo `data/protocolo-audiovisual.json`, com critérios de aceitação, limitações e estado.
- Fonte FDJ sobre horários: https://www.fdj.fr/mag/questions/euromillions-my-million-heure — a hora de extração física não é a hora da difusão televisiva.
- Sem alegação de que vídeos oficiais mostrem sempre a sequência física completa; é necessária revisão individual.


## EUROLAB v0.6 — Testes temporais e rastreabilidade

### Novos ficheiros

- `data/analise-temporal-v06.json`: seis testes de homogeneidade por permutação de sorteios completos (4 000 repetições por teste, correção Holm) e backtest histórico de regra **fixa de 100 sorteios**, com 12 000 simulações nulas.
- `scripts/temporal_lab.py`: código reproduzível, utilizando `numpy`; no Mac: `python3 -m pip install numpy` e `python3 scripts/temporal_lab.py`. A visualização web **não requer numpy nem instalação adicional**.
- `data/estado-investigacao-fisica.json`: mapa de campos técnicos que ainda não têm suporte verificável.
- `PEDIDO_INFORMACAO_TECNICA.md`: perguntas técnicas públicas em português e francês, prontas para adaptar e enviar (não enviadas).
- Nova secção `Laboratório temporal · v0.6` na aplicação.

### Resultados calculados

- Treino apenas com sorteios anteriores **no mesmo regime**; total de **1 699** avaliações prospectivas simuladas a partir do histórico, com 300 observações de treino inicial (100 em cada regime).
- 871 acertos individuais de números (849,5 esperados); 613 acertos individuais de estrelas (611,22 esperados). Isto não equivale a acertar chaves completas.
- Valores-p Monte Carlo bilateral da regra de frequência: números ~0,423; estrelas ~0,943. **Não foi encontrada vantagem preditiva convincente.**
- Nenhum dos seis testes temporais apresentou significância a 5% depois da correção de Holm.

### Interpretação e limitações

A regra foi escolhida após conhecer o histórico e portanto constitui um teste **exploratório**; demonstração confirmatória exigiria avaliação em sorteios futuros. As simulações de referência preservam o caráter sem reposição de cada extração, mas não testam diretamente características físicas.

**Nota jurídica:** https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000041865593 (12/05/2020) permite regulamentarmente meio mecânico ou informático, **sem evidência de utilização informática por sorteio individual**. A FDJ descreve operações mecânicas específicas na página oficial de bastidores.

**Segurança dos dados e validade:** a aplicação não afirma que há método de previsão. Não estão disponíveis identificadores verificados de modelos ou lotes por data. Hashes de integridade locais só detetam alterações, não autenticam a FDJ.


## EUROLAB v0.7 — dependências, dias da semana e rastreabilidade

- Novo separador **Dependências · v0.7** com testes das repetições entre concursos e diferenças entre terça/sexta, com dados por regime.
- `data/analise-dependencias-v07.json`: dez testes em família própria (6 sobreposições, 4 semana), ajustados por Holm-Bonferroni; 50 000 simulações para cada teste de sobreposição e 6 000 permutações por teste do dia da semana.
- `scripts/dependency_lab.py`: reproduz os resultados e testa a integridade dos 1 999 sorteios. Precisa de Python 3 e numpy: `python3 -m pip install numpy` e `python3 scripts/dependency_lab.py`.
- `data/rastreabilidade-v07.json`: cada facto/documento com âmbito e grau de confirmação.
- `ARQUITETURA_FUTURA_WEBAPP.md`: proposta desacoplada para migração futura para uma web app mais simples.
- Os valores-p testam hipóteses nulas **estatísticas**, não identificam defeitos mecânicos ou manipulação. Não há documentação suficiente para atribuir resultados a hardware individual.
- O sorteio de 20/11/2026 continua fora do histórico importado; a base não é atualizada automaticamente.


## EUROLAB v0.8 — posições, origem e rastreabilidade

- Nova aba **Posições & máquinas · v0.8** com seleção de data, sequência original dos campos FDJ, coluna ascendente, arquivo e número de linha.
- Base de 1 999 concursos reconciliada com os campos crescentes do CSV: zero divergências.
- Testes condicionais de permutação para números e três regimes de estrelas, quatro hipóteses globais corrigidas por Holm; resultados não significativos.
- Catálogo de 7 replays ou vídeos identificados, sem alegação de visualização integral ou prova de ordem física.
- Cronologia de 8 eventos com fonte, tipo e limites de conclusão; nenhuma mudança de máquina por número de série confirmada.
- Reproduzir: `python3 scripts/recover_order.py` e `python3 scripts/order_lab.py --simulations 2500`.
- **Ler `RELATORIO_V08.md` para os limites de interpretação e documentação completa.**


## EUROLAB v0.9 — Auditoria financeira e máquinas por concurso

- Novo separador **Auditoria financeira · v0.9**, pesquisável por data, 1999 concursos e 25 609 pares de contagens França–Europa, com filtros de fiabilidade e rastreabilidade de linha CSV.
- Novo separador **Máquinas por sorteio · v0.9**: quatro exemplos de máquina e conjunto de bolas publicados pelo site independente Euro-Millions.com, **sem certificação FDJ**.
- Inconsistência localizada em 31/01/2020, 12 campos de vencedores europeus identificados como não fiáveis (o histórico de bolas permanece inalterado).
- Dados e documentação em `data/auditoria-financeira-v09.json`, `data/maquinas-external-v09.json`, `RELATORIO_V09.md`.
- Regenerar relatório: `python3 scripts/finance_lab.py` (biblioteca padrão, sem instalação).
- Iniciar a aplicação no Mac: `cd /caminho/para/EUROLAB` e `python3 -m http.server 8081`; depois `http://127.0.0.1:8081`.

### Iniciar num clique no Mac

Dá duplo clique em `INICIAR-EUROLAB.command` dentro da pasta descompactada. O atalho identifica automaticamente a pasta, escolhe uma porta local disponível e abre o navegador. Se o macOS bloquear a execução de um ficheiro transferido, podes abri-lo pelo Terminal com `bash INICIAR-EUROLAB.command`.
