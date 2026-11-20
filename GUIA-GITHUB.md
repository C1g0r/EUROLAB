# EUROLAB — GitHub e atualizações

## Repositório de destino

- Conta ligada: **C1g0r**
- Nome escolhido: **EUROLAB**
- Endereço pretendido: https://github.com/C1g0r/EUROLAB
- A publicação ainda depende de criar o repositório **vazio e privado** no GitHub. Este pacote é uma cópia local com Git inicializado, não confirmação de publicação.

## Situação confirmada em 20/11/2026

O repositório privado `C1g0r/EUROLAB` foi criado, mas inicialmente continha apenas um `README.md` e o arquivo `EUROLAB_GitHub_v1.2_pronto_a_publicar.zip`. O código da app não estava descompactado. O atalho `PUBLICAR-GITHUB.command` desta versão corrigida une os dois históricos sem usar force, só se o remoto ainda contiver exatamente estes ficheiros. Se o GitHub tiver alterações adicionais, o script pára.

## Publicação inicial (uma única vez)

1. O repositório privado já foi criado. Não precisas de criar outro.
2. Descompacta o ZIP **corrigido** numa pasta separada, abre `EUROLAB` e faz duplo clique em `PUBLICAR-GITHUB.command`.
3. Se o macOS bloquear, no Terminal escreve `bash `, arrasta o ficheiro e prime Enter.
4. Confirma em https://github.com/C1g0r/EUROLAB que `index.html`, `assets/` e `data/` aparecem na raiz.
5. Mantém a pasta local: a partir daqui `ATUALIZAR-GITHUB.command` pode atualizar a mesma branch.

O script utiliza autenticação SSH normal do Git, sem pedir nem guardar tokens. O acesso GitHub por SSH deve estar configurado no Mac.

## Atualizações posteriores

Ao desenvolver uma versão nova, o ideal é atualizar primeiro os ficheiros, executar os testes e **criar um commit** no mesmo repositório. O ficheiro `ATUALIZAR-GITHUB.command` permite publicar alterações feitas localmente, depois de mostrar os ficheiros alterados e pedir confirmação. Para atualizações efetuadas através de ChatGPT, é necessário que o repositório esteja acessível pela ligação GitHub nessa sessão; as alterações não ocorrem automaticamente em segundo plano.

Comandos manuais equivalentes:

```bash
git status
git add -A
git commit -m "EUROLAB: descrição da alteração"
git push origin main
```

## Testes

```bash
python3 tests/verificar_dados.py
node --check assets/app.js
node --check assets/strategy.js
```

O workflow em `.github/workflows/validar.yml` executa estas verificações no GitHub Actions após as alterações serem enviadas.

## Privacidade e integridade

Os 6 arquivos de origem foram fornecidos pelo utilizador e têm proveniência declarada FDJ; o projeto distingue validação estrutural da confirmação independente de autenticidade. Evita adicionar segredos, tokens ou dados privados ao repositório. A criação de um repositório público deve ser uma decisão separada. As chaves guardadas no navegador (`localStorage`) não são sincronizadas pelo Git.
