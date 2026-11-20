# EUROLAB v1.2 — Relatório de desenvolvimento e validação

**Data de referência:** 20/11/2026 (antes do sorteio). Histórico preservado até 17/11/2026.

## Funcionalidades novas

1. Criador de estratégias com pesos exponenciais sobre as frequências históricas: `peso = exp(k * (2*(freq-min)/(max-min)-1)/2)`, com `k` entre −3 e +3. Se a amplitude das frequências for 0, usa pesos uniformes. Extração sem reposição. Quanto mais alto `k`, maior o favorecimento histórico das maiores frequências.
2. Possibilidade de excluir números, fixar paridade, impor o mínimo de números superiores a 31 e intervalo da soma. A seleção tenta até 1 800 combinações. Se não existir uma combinação que cumpra os critérios nas tentativas, a aplicação **informa o utilizador**, em vez de aplicar regras silenciosas diferentes.
3. Teste cronológico: ordena os sorteios da era de 12 estrelas, usa estritamente os 100 ou 250 anteriores a cada data avaliada e seleciona uma combinação por concurso. Semente `mulberry32` reprodutível; no gerador direto usa `crypto.getRandomValues` onde disponível.
4. Referência descritiva: 500 sequências simuladas de resultados independentes, confrontadas com as chaves previstas; mostra bandas centrais de aproximadamente 90%. **Não** é um valor-p calibrado da estratégia adaptativa, pois as previsões históricas permanecem fixas durante a simulação. Não equivale a lucro, probabilidade futura ou vantagem demonstrada.
5. Diário de evidências local, com submissão validada de data efetivamente presente no histórico; URLs limitadas a `http(s)` e texto escapado ao exibir. Os registos não são prova de identidade ou certificação do equipamento.
6. Integração com Cofre e exportações CSV/JSON; no mesmo projeto permanecem os módulos anteriores.

## Teste funcional efetuado

Com predefinição «Frequências altas», janela 250, semente `20261120`, avaliação dos últimos 120 concursos do regime atual: **67** acertos individuais dos números e **38** das estrelas, em 120 chaves históricas; expectativa no modelo uniforme de **60** e **40** respetivamente. Estes totais são compatíveis com o acaso e não comprovam melhoria. Os resultados variam com parâmetros e semente.

Testados no Chromium: geração de dez chaves distintas com cada uma das cinco predefinições, gamas 5/50 e 2/12, soma/paridade/anti-datas, exclusões válidas e rejeição de exclusões inválidas, teste cronológico, repetibilidade com a mesma semente, exportações, integração com Cofre, criação e remoção de evidência, prevenção de interpretação HTML no texto das notas, e interface móvel sem scroll horizontal. O teste foi executado com os JSON originais carregados na memória do navegador. O teste não constitui uma auditoria de segurança abrangente.

## Fontes principais

- Arquivos FDJ: https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/historique
- Regulamento publicado para 2026: https://www.pdj.pf/wp-content/uploads/2025/05/Reglement-EuroMillions-applicable-a-partir-du-30.03.26.pdf
- Fichas técnicas e evidências: `data/fontes-tecnicas.json`, com indicação do grau de confirmação.

## Limitações

Não existe certificação independente da autenticidade dos seis ZIP em relação ao servidor original; não foi feita auditoria visual integral das gravações nem obtida a relação oficial entre sorteios, máquinas, bolas e lotes. A aplicação é uma ferramenta de análise local; não está publicada na Internet e não tem atualização automática de resultados.
