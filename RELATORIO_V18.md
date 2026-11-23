# EUROLAB v1.8 — Geração individual e manómetros científicos

## Produto
A página principal entrega duas chaves com métodos distintos, geradas individualmente por botões separados. Existe também a opção Gerar ambas. Gerar uma chave deixa a outra intacta; se ambas existirem, não há números nem estrelas repetidos.

## Chave 1
Modelo: seletor walk-forward v1.7, que escolhe o melhor resultado histórico observado entre cinco estratégias. A comparação utiliza 250 concursos, cinco sementes e uma janela anterior de 250 concursos, sem utilizar o resultado futuro na geração de cada previsão histórica.

**Manómetro 1:** a média de acertos ponderados por chave histórica (números + 0,5 × estrelas). Valor real mostrado em decimal, escala visual fixa de 0 a 1,5. Referência matemática para sorteios justos e independentes: 0,6666667. O limite da escala é apenas uma escolha de visualização, com saturação fora do intervalo. O ponteiro e o preenchimento dependem diretamente de `activeSelection.selected_score`; não se inventa percentagem de confiança ou probabilidade de previsão.

O manómetro 1 representa a estatística do **método**, não uma diferença estatística entre combinações específicas criadas por esse método. Por isso pode manter o mesmo valor quando a chave 1 é regenerada com o mesmo histórico.

## Chave 2
Modelo: Crowd Intelligence v1.4, coeficiente de calendário da razão agregada entre vencedores com 3+0 e 2+0.

**Manómetro 2:** `exp(beta × (d − 3))`, onde `d` é o número de valores de 1 a 31 na chave 2 e `beta` é o coeficiente calibrado no estudo. Referência 1,00, escala visual fixa de 0,85 a 1,15, com saturação fora do intervalo. A apresentação exibe o índice exato e o afastamento percentual **da razão agregada**, não um percentual de probabilidade de ganho ou de partilha.

O valor pode mudar ao gerar uma nova Chave 2, mas não mede diretamente quantos jogadores terão feito esta combinação; a seleção por categorias leva em conta a quantidade de combinações disponíveis e não representa probabilidade individual medida.

## Probabilidade matemática invariável
Cada chave válida tem **1 / 139 838 160** de acertar o jackpot num sorteio justo. O valor é apresentado separadamente, nunca confundido com os manómetros. Duas chaves distintas têm probabilidade conjunta do jackpot de **2 / 139 838 160**.

## Estado e testes
- `assets/duas-chaves-core.js`: `generateFirst(..., other)` e `generateSecond(..., other)`; validação de ausência de sobreposição.
- `assets/duas-chaves.js`: dois botões individuais, restauração de zero, uma ou duas chaves na origem atual, e desenho dos dois medidores SVG.
- `index.html`: nova estrutura e indicação fixa da probabilidade matemática.
- `assets/duas-chaves.css`: manómetros semicirculares responsivos.
- `tests/duas-chaves.test.cjs`: geração nas duas ordens, preservação da outra chave e verificação de manómetros no HTML.

Os indicadores são exploratórios e não demonstram capacidade de prever resultados. A escolha do modelo com maior pontuação observada está sujeita a viés de seleção e comparação múltipla.

Esta atualização não altera os dados históricos oficiais existentes nem os modelos previamente calibrados.
