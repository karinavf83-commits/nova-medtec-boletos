# Nova Medtec — Solicitação de Boletos

Aplicativo para controle de solicitações de boleto faturado entre as lojas
(filiais) e a matriz da Nova Medtec Cirúrgica. Construído em **Next.js 16 +
TypeScript**, pronto para deploy gratuito na **Vercel**.

## Stack

- **Next.js 16** (App Router, Route Handlers) + **TypeScript** + **React 19**
- **Tailwind CSS v4** — identidade visual Nova Medtec (azul-marinho + ciano,
  tipografia Newsreader + IBM Plex)
- **Neon** (Postgres serverless, plano gratuito) + **Drizzle ORM**
- **Vercel Blob** — upload do anexo da nota fiscal
- **Resend** — envio de e-mail quando o status de uma solicitação muda
- Autenticação própria (e-mail/senha com `bcryptjs` + cookie de sessão
  assinado com `jose`), restrita a uma allowlist de e-mails administradores

## Como funciona

1. **Tela pública (`/`)** — o pessoal das lojas preenche o formulário de
   solicitação de boleto (cliente, CNPJ/CPF, vencimento, nota fiscal + anexo,
   valor, à vista/parcelado, e-mail e telefone do cliente, pessoa de
   contato). Ao enviar, o pedido fica com status **Pendente**.
2. **Painel administrativo (`/painel`)**, protegido por login — restrito às
   administradoras autorizadas (veja `ADMIN_EMAIL_ALLOWLIST` abaixo). Nele é
   possível filtrar por loja, cliente, status e período, ver os detalhes de
   cada solicitação, baixar a nota fiscal anexada, mudar o status
   (**Pendente → Em análise → Feito**) e exportar tudo para CSV.
3. Sempre que o status de uma solicitação muda, e se quem solicitou informou
   o próprio e-mail, um aviso automático é enviado por e-mail (via Resend).

## Configuração local — passo a passo

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o banco de dados (Neon — gratuito)

1. Crie uma conta em [neon.tech](https://neon.tech) e um novo projeto.
2. Copie a **connection string** (aba "Connection Details", com pooling
   habilitado).
3. Cole em `DATABASE_URL` no seu `.env.local` (veja passo 5).
4. Rode a migração:

   ```bash
   npm run db:push
   ```

   Isso cria as tabelas `users`, `user_passwords`, `sessions` e
   `boleto_requests`. (Alternativa: rode o conteúdo de
   `drizzle/0000_init.sql` diretamente no SQL Editor do Neon.)

### 3. Criar o armazenamento de arquivos (Vercel Blob — gratuito)

1. No [dashboard da Vercel](https://vercel.com/dashboard), abra (ou crie) o
   projeto → aba **Storage** → **Create Database** → **Blob**.
2. Conecte o Blob store ao projeto — a Vercel gera automaticamente a
   variável `BLOB_READ_WRITE_TOKEN`.
3. Para rodar localmente, copie esse token também para o `.env.local` (a
   Vercel mostra o valor na página do Blob store).

### 4. Criar o envio de e-mail (Resend — gratuito)

1. Crie uma conta em [resend.com](https://resend.com).
2. Em **API Keys**, gere uma chave e copie para `RESEND_API_KEY`.
3. (Opcional, mas recomendado) Verifique um domínio próprio em **Domains**
   para poder enviar de um endereço como
   `notificacoes@boletos.novamedtec.com.br`, e configure isso em
   `EMAIL_FROM`. Sem domínio verificado, o Resend só permite enviar para o
   e-mail da sua própria conta — útil para testar, mas não para produção.

### 5. Configurar as variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável                | Onde conseguir                                              |
| ------------------------ | ------------------------------------------------------------ |
| `DATABASE_URL`          | Neon → Connection string                                     |
| `JWT_SECRET`             | Gere com `openssl rand -base64 32` (ou qualquer texto longo e aleatório) |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → seu Blob store                             |
| `RESEND_API_KEY`        | Resend → API Keys                                             |
| `EMAIL_FROM`             | Um remetente do domínio verificado no Resend                 |
| `ADMIN_EMAIL_ALLOWLIST` | E-mails autorizados a criar conta de administradora, separados por vírgula (ex: `karinavf83@gmail.com,renata@novamedtec.com.br`) |

### 6. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) — formulário público
na raiz, painel em `/painel` (crie sua conta primeiro em `/registrar`, com um
e-mail que esteja em `ADMIN_EMAIL_ALLOWLIST`).

## Deploy na Vercel (gratuito)

1. Suba este projeto para um repositório no GitHub:

   ```bash
   git remote add origin <url-do-seu-repositorio-no-github>
   git push -u origin main
   ```

2. Em [vercel.com/new](https://vercel.com/new), importe esse repositório —
   a Vercel detecta o Next.js automaticamente.
3. Antes de clicar em Deploy, adicione as mesmas variáveis de ambiente do
   passo 5 em **Environment Variables** (com os valores de produção — pode
   ser o mesmo banco Neon, ou um projeto Neon separado para produção).
4. Clique em **Deploy**. Depois do primeiro deploy, crie o Blob store (passo
   3 acima) diretamente a partir desse projeto na Vercel, se ainda não
   tiver feito.
5. Rode a migração do banco (`npm run db:push`, com o `DATABASE_URL` de
   produção no `.env.local` local) ou execute `drizzle/0000_init.sql` no SQL
   Editor do Neon.

## Estrutura do projeto

```
src/app/                    página pública (/), login, registrar, painel
src/app/api/auth/           login, registro, sessão, logout
src/app/api/boleto-requests/ criar, listar (com filtros), atualizar status, exportar CSV
src/app/api/upload/         token de upload para o Vercel Blob
src/lib/auth/                sessão (JWT + cookie), senha (bcrypt), allowlist de admin
src/lib/db/                  schema Drizzle + cliente Postgres
src/lib/email.ts             envio de e-mail (Resend)
src/components/              componentes de UI (Tailwind)
drizzle/0000_init.sql        schema SQL inicial (fonte alternativa à migração via Drizzle)
```

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — ESLint
- `npx tsc --noEmit` — checagem de tipos
- `npm run db:push` — aplica o schema do Drizzle no banco configurado em `DATABASE_URL`
- `npm run db:studio` — explora o banco visualmente (Drizzle Studio)
