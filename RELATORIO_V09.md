# EUROLAB v0.9 — Relatório de auditoria financeira e identificação de equipamento

Data de corte: **17/11/2026**. Período analisado: **13/02/2004–17/11/2026**.

## Fontes e limites

- Seis arquivos ZIP enviados pelo utilizador e declarados FDJ; fontes originais preservadas em `fontes/originais/`, hashes SHA-256 em `data/auditoria-financeira-v09.json`.
- Página oficial FDJ que oferece seis downloads ZIP: https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/historique
- A origem declarada não equivale a uma assinatura digital oficial. O nosso projeto valida dados, não autentica independentemente a FDJ.
- Uma fonte secundária, https://www.euro-millions.com/, indica identificadores de máquinas e conjuntos de bolas em páginas de resultados de concursos. Estes campos são candidatos à investigação, não informações confirmadas pelo operador.

## Auditoria de vencedores por território

- Sorteios examinados: **1,999**.
- Pares de contagens França–Europa examinados: **25,609**.
- Sorteios com França > Europa em pelo menos um escalão: **1**.
- Pares assinalados: **12**.
- Ficheiro afetado: `euromillions_201902.zip` / `euromillions_201902.csv`, linha **2**, data **31/01/2020**.
- Nesta linha, escalões **2 a 13** apresentam vencedores franceses positivos mas contagem europeia igual a zero. O 1.º escalão apresenta 0/0 e não é inconsistente.
- Valores preservados sem alteração. Para análises de vencedores europeus, campos logicamente inconsistentes são tratados como **desconhecidos / nulos**, não como zero.
- Uma página independente fornece **12 vencedores europeus (4 em França) no escalão 2**: https://www.tirage-euromillions.net/euromillions/resultats/2020/vendredi-31-janvier/. Trata-se de um teste pontual, não de substituição automática de todas as linhas.

### O que esta auditoria não prova

Não permite inferir irregularidades nas máquinas, nem pagamentos errados, nem que todas as linhas restantes estejam corretas. O teste é uma regra de coerência básica; não é uma auditoria financeira integral. Valores de prémios publicados em euros são informativos e não são receitas, apostas nem lucros. Evitar agregar prémios de vários países sem tratar moedas.

## Catálogo de equipamentos publicados por um fornecedor independente

| Sorteio | Identificador máquina | Identificador de conjunto | Fonte |
|---|---|---|---|
| 13/02/2004 | Machine 1 | E1 | https://www.euro-millions.com/fr/resultats/13-02-2004 |
| 16/09/2016 | 3 | 4 | https://www.euro-millions.com/fr/resultats/16-09-2016 |
| 31/01/2020 | 1 | 19 | https://www.euro-millions.com/fr/resultats/31-01-2020 |
| 17/11/2026 | 13 | 21 | https://www.euro-millions.com/fr/resultats/17-11-2026 |

**Advertência:** estes números não são uma verificação de modelo ou número de série, não identificam claramente máquinas A/B individualmente, e não são informação certificada pela FDJ. É necessário solicitar proveniência aos responsáveis da fonte e confirmar independentemente. Para inferências estatísticas sobre equipamento, necessitaríamos de uma amostra muito maior com identificadores verificados e calibração para múltiplos testes.

## Como reproduzir a auditoria

Executar dentro da pasta EUROLAB: `python3 scripts/finance_lab.py`.
A execução usa apenas a biblioteca padrão do Python, verifica totais e compara as constatações do CSV com as do relatório.

## Utilização da interface

Iniciar com `python3 -m http.server 8081` dentro da pasta EUROLAB. Abrir `http://127.0.0.1:8081` e escolher **Auditoria financeira · v0.9** ou **Máquinas por sorteio · v0.9**. Sem servidor, o navegador pode bloquear a leitura dos JSON locais.
