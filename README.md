# meu-casamento

Aplicativo de planejamento de casamento — convidados, orçamento e pagamentos, fornecedores/contratos, checklist, cronograma, mesas, presentes e inspirações. Funciona 100% offline (PWA instalável), com os dados salvos no navegador.

Este é um projeto novo, construído do zero, sem nenhum código reaproveitado de projetos anteriores.

## Como usar localmente

Como o app registra um service worker (para funcionar offline), ele precisa ser aberto via um servidor HTTP local (não funciona abrindo o `index.html` direto com duplo clique em `file://`).

Com Python instalado, na pasta do projeto:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000` no navegador.

## Publicar no GitHub Pages

1. Suba todos os arquivos deste projeto para a branch `main` do repositório.
2. No GitHub, vá em **Settings → Pages**.
3. Em "Source", selecione a branch `main` e a pasta `/ (root)`.
4. Salve. Em alguns minutos o site estará disponível em `https://<seu-usuario>.github.io/<nome-do-repositorio>/`.

## Estrutura do projeto

```
index.html          shell da aplicação (SPA com navegação por hash)
manifest.json        manifesto do PWA
sw.js                 service worker (cache offline)
css/styles.css        estilos (mobile-first)
js/config.js           configurações e placeholders (ex: Supabase)
js/utils.js             funções auxiliares
js/store.js              camada de dados (localStorage hoje; pronta para Supabase depois)
js/app.js                 shell + navegação (router)
js/modules/*.js           um módulo por seção (dashboard, convidados, orçamento, etc.)
assets/icons/              ícones do PWA
```

## Backup dos dados

Na tela **Configurações** é possível exportar um backup em `.json` e importar novamente depois. Isso é importante enquanto não há sincronização em nuvem configurada — os dados ficam salvos apenas no navegador/dispositivo em uso.

## Conectar Supabase (opcional, para login e sincronização entre dispositivos)

O projeto já está preparado para isso, mas ainda não está conectado a nenhum backend. Quando quiser configurar:

1. Crie um novo projeto em https://supabase.com (recomendado: um projeto **separado** do usado pelo Wedding Hub antigo).
2. Pegue a **Project URL** e a **anon public key** em Project Settings → API.
3. Preencha esses valores em `js/config.js`, no objeto `supabase`.
4. A partir daí, a lógica de sincronização pode ser adicionada em `js/store.js`, no ponto já sinalizado no comentário dentro da função `persist()`.

## Licença / uso

Projeto pessoal da Raphaella para organização do próprio casamento.
