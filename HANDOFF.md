# Handoff — Nova Medtec: Solicitação de Boletos

Documento de continuidade gerado em 2026-08-17 pelo Claude Code, para retomar o
trabalho em outra ferramenta (Antigravity). Resume o que já foi feito, o
estado atual do deploy, e o que falta resolver.

## O que é o projeto

App para a matriz da Nova Medtec Cirúrgica controlar solicitações de boleto
faturado enviadas pelas lojas/filiais.

- **Tela pública (`/`)**: lojas preenchem formulário pedindo boleto (cliente,
  CNPJ/CPF, vencimento, nota fiscal + anexo, valor, à vista/parcelado,
  contato). Fica com status "Pendente".
- **Painel admin (`/painel`)**, login restrito: lista solicitações com
  filtros (loja/cliente/status/data), permite ver detalhes, baixar a nota
  fiscal anexada, mudar status (Pendente → Em análise → Feito), exportar CSV.
- E-mail automático (Resend) para quem solicitou quando o status muda.
- **Este app NÃO gera boletos bancários de verdade** — é só o controle das
  solicitações. A administradora gera o boleto manualmente no banco/sistema
  que já usa, e depois marca como "Feito" aqui.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4, Drizzle ORM + Neon
(Postgres), Vercel Blob (upload da nota fiscal), Resend (e-mail), auth própria
(bcrypt + JWT em cookie httpOnly).

## ⚠️ Sobre os dois caminhos da pasta do projeto (IMPORTANTE)

Existiam DUAS cópias em disco com o mesmo conteúdo, que **não sincronizavam
automaticamente entre si** (isso já causou confusão/retrabalho nesta sessão):

- `C:\Users\Karina\Downloads\theubolso-app_4\nova-medtec-boletos` — **esta é
  a cópia íntegra e atualizada. Use esta a partir de agora.**
- `C:\Users\Karina\OneDrive - Palmipé\Área de Trabalho\CLAUDE\ACPLICATIVO BOLETOS LOJAS PRÓPRIAS\nova-medtec-boletos`
  — em algum momento no fim desta sessão essa pasta **ficou vazia** (só o
  `.git`, `node_modules` e todo o código sumiram, restando só este
  HANDOFF.md). Não sabemos exatamente o que causou isso (possivelmente
  relacionado à configuração do Antigravity, ou um problema de sync do
  OneDrive) — mas o conteúdo real do projeto está seguro na pasta de
  Downloads acima.

**Recomendação**: abrir o projeto no Antigravity a partir da pasta de
**Downloads**, e reconectar o GitHub Desktop a ela também (Remove Repository
→ Add Local Repository apontando pra
`C:\Users\Karina\Downloads\theubolso-app_4\nova-medtec-boletos`), já que ela
tem o histórico do Git intacto (falta só sincronizar 1 commit de debug que só
existiu na pasta do OneDrive — ver seção de bugs corrigidos, item 3).

## Estado do deploy (o que já está no ar)

- **GitHub** (privado): `https://github.com/karinavf83-commits/nova-medtec-boletos`
  — branch `main`, sincronizado via GitHub Desktop.
- **Vercel**: `https://nova-medtec-boletos.vercel.app/` — projeto dentro do
  time "Projeto Fluxo de Caixa" (Hobby). Auto-deploy a cada push no GitHub.
- **Neon** (Postgres): projeto conectado, schema já migrado (tabelas `users`,
  `sessions`, `user_passwords`, `boleto_requests` existem e foram
  confirmadas). Connection string está em `.env.local` (não incluída aqui por
  segurança).
- **Vercel Blob**: store criado, token copiado para `.env.local` —
  **funcionamento em produção ainda não confirmado** (ver pendências).
- **Resend**: conta criada, API key em `.env.local`. `EMAIL_FROM` está usando
  o domínio sandbox `onboarding@resend.dev`, que **só entrega e-mail para o
  endereço da própria conta Resend** — para funcionar para todo mundo,
  precisa verificar um domínio próprio no Resend e atualizar `EMAIL_FROM`.

Todas as 6 variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`,
`BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`,
`ADMIN_EMAIL_ALLOWLIST`) já estão preenchidas localmente em `.env.local` (nas
duas pastas) e também configuradas nas Environment Variables do projeto na
Vercel.

## Bugs já encontrados e corrigidos nesta sessão

1. **`drizzle.config.ts` só carregava `.env`, não `.env.local`** — por isso
   `npm run db:push` sempre falhava/travava tentando conectar em
   `127.0.0.1:5432` (padrão do driver quando a URL vem `undefined`). Corrigido
   trocando `import "dotenv/config"` por
   `dotenv.config({ path: ".env.local" })`. Já commitado e no ar.
2. **`DATABASE_URL` na Vercel estava com o texto de exemplo**
   (`postgres://user:pass@db.example.com:5432/app`) em vez da string real do
   Neon — provavelmente porque o truque de colar as 6 variáveis de uma vez no
   formulário de import não separou os valores corretamente. Foi corrigido
   manualmente editando a variável direto nas Environment Variables da
   Vercel, seguido de Redeploy.
3. Endpoint de registro (`src/app/api/auth/register/route.ts`) foi
   temporariamente alterado para expor `causa:` e `code:` do erro na
   resposta, para facilitar diagnóstico em produção. **Considerar reverter
   isso depois de resolvido**, para não vazar detalhes internos do banco em
   erros voltados ao usuário final (atualmente só mostra pra quem está
   tentando logar/cadastrar, mas é boa prática limpar depois).

## 🔴 Pendência ativa (onde paramos)

Ao testar o formulário público (`/`) em produção com um anexo de nota fiscal
(PDF), o botão "Enviar solicitação" fica travado permanentemente em "Enviando
solicitação..." — nunca conclui nem mostra erro.

**Hipótese mais provável**: o valor de `BLOB_READ_WRITE_TOKEN` na Vercel
também pode estar com texto de exemplo/errado, do mesmo jeito que aconteceu
com `DATABASE_URL` (item 2 acima) — o truque de colar todas de uma vez
parece ter falhado para mais de uma variável.

**Próximos passos sugeridos**:
1. Na Vercel → Settings → Environment Variables, abrir `BLOB_READ_WRITE_TOKEN`
   e conferir se o valor é mesmo o token real (começa com
   `vercel_blob_rw_...`), não um texto de exemplo. Corrigir se necessário e
   fazer Redeploy.
2. Também vale conferir `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` e
   `ADMIN_EMAIL_ALLOWLIST` da mesma forma — só `DATABASE_URL` foi confirmada
   como problema até agora, mas as outras não foram checadas uma a uma.
3. Se o token do Blob estiver certo e mesmo assim travar, abrir o DevTools do
   navegador (F12) → aba **Network**, achar a requisição para `/api/upload`
   e ver se ela fica "pending" (trava no servidor) ou dá erro (mostra no
   Console). Isso ajuda a saber se o problema é a chave, a rede, ou um bug no
   código de upload (`src/app/page.tsx`, função `handleSubmit`, e
   `src/app/api/upload/route.ts`).
4. Depois de resolver o upload, testar o fluxo completo de novo: cadastro em
   `/registrar` (e-mail `karinavf83@gmail.com`) → login → enviar solicitação
   pela `/` → conferir no `/painel` → mudar status → checar se chegou e-mail
   (só chega no e-mail da conta Resend, por causa do domínio sandbox).

## Outras pendências (não bloqueantes)

- **E-mail da Renata Maciel**: só `karinavf83@gmail.com` está autorizado a
  criar conta de administradora (`ADMIN_EMAIL_ALLOWLIST`). Quando tiver o
  e-mail dela, adicionar separado por vírgula nessa variável (local e na
  Vercel) e redeploy.
- **Domínio de e-mail verificado no Resend**: sem isso, notificações de
  mudança de status só chegam no e-mail da própria conta Resend, não nos
  e-mails reais de quem solicitou.
- **Logo da empresa**: atualmente o cabeçalho usa um ícone genérico
  (Stethoscope, do lucide-react) + texto "Nova Medtec Cirúrgica", não uma
  logo de verdade. Se ela tiver o arquivo da logo, pode ser adicionado em
  `src/components/brand-header.tsx`.
- Reverter o detalhamento de erro exposto no `register/route.ts` (ver item 3
  da seção de bugs corrigidos) depois que tudo estiver funcionando.

## Estrutura do projeto (referência rápida)

```
src/app/                    página pública (/), login, registrar, painel
src/app/api/auth/           login, registro, sessão, logout
src/app/api/boleto-requests/ criar, listar (filtros), status, export CSV
src/app/api/upload/         token de upload para o Vercel Blob
src/lib/auth/                sessão (JWT+cookie), senha (bcrypt), allowlist
src/lib/db/                  schema Drizzle + cliente Postgres
src/lib/email.ts             envio de e-mail (Resend)
src/components/              componentes de UI (Tailwind)
drizzle/0000_init.sql        schema SQL inicial
README.md                    guia de setup completo (Neon/Blob/Resend/Vercel)
```

Scripts úteis: `npm run dev`, `npm run build`, `npm run db:push`,
`npm run db:studio` (explorar o banco visualmente).
