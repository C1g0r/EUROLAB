# EUROLAB v1.4 — Crowd Intelligence e sincronização FDJ

Data: 20/11/2026. Estado: implementação publicada, execução agendada pendente de confirmação em Actions.

## Resumo
Desenvolvidos dois módulos de prioridade elevada: (1) um indicador EXPERIMENTAL de padrões de calendário nas escolhas dos jogadores e (2) um atualizador condicionado a verificações rígidas, que procura novos concursos no arquivo público da FDJ.

## Modelo científico
Pergunta: a quantidade de números 1–31 sorteados está associada à razão entre o número de vencedores europeus com 3+0 e os vencedores com 2+0?

Fonte: dados financeiros em data/auditoria-financeira-v09.json, e números correspondentes em data/dados-validados.json. Esquema de 13 escalões de prémios. Usam-se escalões 10 (3+0) e 13 (2+0), do período de doze estrelas iniciado em 27/09/2016.

O alvo é log((ganhadores_3+0 + 0,5)/(ganhadores_2+0 + 0,5)).
A variável explicativa é a contagem de números principais em 1–31, de zero a cinco.
O modelo é uma regressão linear de um atributo. Os coeficientes fixos são aproximadamente:
- Interceção -2,81091457
- Inclinação +0,04625880 por número de calendário.

Exclui-se o concurso de 31/01/2020 porque 12 contagens europeias do arquivo são inconsistentes.
São 1 058 observações elegíveis entre 27/09/2016 e 17/11/2026.
Treino até dezembro de 2023: 757 observações.
Teste sem refit, janeiro de 2024 a novembro de 2026: 301 observações.
EQM do modelo de referência constante: 0,004660430090.
EQM do modelo de calendário: 0,002596905879.
Redução relativa do EQM: 44,27755%.

Numa divisão mais antiga, treino até 2020 e validação 2021–2023, a redução foi de ~41,86%. Estes números resultam de divisão cronológica, mas NÃO constituem teste pré-registado nem prova de vantagem económica.

## Interpretação rigorosa
O indicador na web app mostra exp(inclinação × [número de datas - 3]) comparado com uma chave de três números 1–31.
Exemplo: 3 números de calendário = referência zero; 5 números de calendário ≈ +9,7% na RAZÃO de categorias prevista pelo modelo.
Não representa +9,7% de risco individual de partilha, nem a probabilidade de qualquer chave ter sido escolhida.
Não modela estrelas; com zero ou um números de calendário existem apenas 5 e 40 observações, respetivamente, pelo que o painel assinala a reduzida cobertura.

O método observa contagens de vencedores de categorias agregadas. Poderá haver confundimento por volume de apostas, tipologia do boletim, escolha automática de números, número 7 e comportamento do mercado. Não há informação de apostas individuais nem comprovativo de que a distribuição de vencedores se traduza diretamente em partilha de jackpot.

## Sincronização FDJ
- Script: scripts/atualizar_fdj.py (biblioteca padrão Python).
- Workflow: .github/workflows/atualizar-fdj.yml.
- Fonte preferencial: ligações encontradas na página pública do histórico FDJ; ligação direta de referência como alternativa.
- Seguranças: HTTPS/domínio FDJ autorizado, ZIP e CSV de formato esperado, pelo menos 100 datas históricas coincidentes, combinações sem contradições, datas únicas, calendários terça/sexta, sem lacunas, 13 categorias financeiras coerentes e sem publicação de datas futuras.
- O script opera apenas por acrescento. Nunca apaga ou substitui resultados antigos. Em caso de conflito não publica.
- Se há novos concursos, atualiza JSON histórico, CSV, auditoria financeira e metadados; conserva o novo ZIP na pasta fontes/atualizacoes.
- O workflow tenta enviar commit para a branch main e solicita nova publicação Pages. As execuções programadas do GitHub podem atrasar ou falhar por alterações da FDJ ou permissões, e exigem monitorização em Actions.
- Não são recolhidos automaticamente dados de máquinas/lotes sem documentação fiável.

## Verificações disponíveis
- node tests/crowd.test.cjs
- python3 scripts/popularidade_lab.py
- python3 tests/test_atualizador_fdj.py
- python3 tests/verificar_dados.py

A configuração do workflow foi enviada ao GitHub. A mera existência do ficheiro NÃO comprova que uma execução programada terminou com sucesso. Confirmar os resultados na página Actions.

## Referências
- https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/historique
- https://academic.oup.com/jrssig/article/20/1/31/7034183
- https://www.cambridge.org/core/journals/judgment-and-decision-making/article/number-preferences-in-lotteries/47BA27051627CEED421AD3AEE255521E

Mensagem fundamental: nenhum método demonstrou melhorar a probabilidade de uma chave ser sorteada.
