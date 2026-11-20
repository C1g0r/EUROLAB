# EUROLAB — plano para futura web app (v0.7)

Este documento prepara a futura interface simplificada, mas **não** altera a tecnologia atual nem instala serviços externos.

## 1. Separação de camadas
- **Dados históricos imutáveis**: `data/dados-validados.json` e `data/historico-euromilhoes.csv` (versão e data de corte).
- **Relatórios derivados**: `data/analise-*.json`, gerados pelos scripts e não editados manualmente.
- **Evidências**: `data/rastreabilidade-v07.json`, com estados *confirmado*, *noutro jogo* e *não verificado*.
- **Auditorias manuais**: os registos de vídeo ficam no navegador e exigem exportação. Futuro: API autenticada + log de revisão.

## 2. Contrato de dados futuro
`GET /api/v1/draws?from=&to=` → `{meta:{cutoff,source,validation},draws:[{date,numbers,stars}]}`.
`GET /api/v1/analyses/dependencies` → `analise-dependencias-v07.json`.
`GET /api/v1/evidence` → `rastreabilidade-v07.json`.
`GET /api/v1/revisions` → versão, hashes, origem verificada ou não, data de auditoria.

## 3. Interface futura
Cinco menus: **Início**, **Histórico**, **Estatísticas**, **Laboratório**, **Investigação técnica**. Dentro do laboratório, subabas temporais, dependências, vídeos.

## 4. Critérios inegociáveis
- Mostrar distintamente data do sorteio, data de atualização dos arquivos e método de verificação.
- Nunca misturar uma especificação de bolas LOTO com EuroMillions.
- Não gerar chaves com alegação de previsão.
- Não alterar resultados dos sorteios em resposta a transcrições de vídeos.
- Auditorias humanas devem ter origem, URL, observações, quem verificou e estado da revisão.
- Controlar a importação por testes automatizados, hashes e dados de proveniência.
- A eventual web app alojada deverá aceder ao JSON versionado através de um serviço simples ou ficheiros estáticos, sem necessitar de partilhar fontes privadas.

## 5. Estado atual
v0.7 estática, sem servidor de dados, sem registo de utilizadores, não publicada. A aplicação é executada num servidor local `python3 -m http.server 8080`.
