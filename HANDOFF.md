# Handoff — BoletoMed (Nova Medtec Cirúrgica)

Atualizado em 2026-08-19 pelo Claude Code. Resume o que o app faz, o estado
atual do deploy, tudo que foi corrigido/adicionado, e o que ainda falta.

## O que é o projeto

App para a matriz da Nova Medtec Cirúrgica controlar solicitações vindas das
lojas/filiais. Internamente chamado de **BoletoMed** (nome só dentro do app —
cabeçalho e aba do navegador; a URL de produção continua
`nova-medtec-boletos.vercel.app` de propósito, pra não quebrar o QR code já
impresso/distribuído).

Duas telas públicas, com navegação entre elas no topo:

- **Solicitação de Boleto (`/`)**: loja escolhe a si mesma numa lista (22
  lojas ativas, vinda da planilha da empresa), preenche dados do cliente
  (CNPJ/CPF e telefone com máscara automática), anexa a nota fiscal, escolhe
  à vista ou parcelado. Vencimento é calculado automaticamente a partir de
  "dias para vencimento"; parcelado acima de R$2.000 sugere 3x em 15/30/45
  dias, acima de R$5.000 sugere 3x em 30/60/90 dias (com valor de cada
  parcela já calculado). Fica com status "Pendente".
- **Análise de Crédito (`/analise-credito`)**: loja pede uma checagem de
  crédito do cliente (CNPJ/CPF, nome, telefone, valor de intenção de compra)
  **antes** de decidir vender fiado. Fluxo independente do boleto, sua
  própria tabela no banco, mesmo padrão de status.

**Painel admin (`/painel`)**, login restrito à Karina e à Renata, com abas
pra alternar entre as duas seções acima:

- `/painel`: lista de boletos, cards de resumo (pendentes/em análise/
  feitos/valor em aberto), filtros, detalhe com download da nota fiscal,
  mudança de status, exportar CSV.
- `/painel/credito`: mesmo padrão pra análises de crédito (sem exportar CSV
  ainda), sem decisão de aprovar/reprovar nem limite de crédito — só
  acompanhamento de status, por escolha da Karina.

E-mail automático (Resend) pra quem solicitou, nos dois fluxos, quando o
status muda.

**Este app NÃO gera boletos bancários de verdade nem faz análise de crédito
automatizada** — é só o controle das solicitações. A administradora processa
manualmente (gera o boleto no banco, avalia o crédito) e depois marca como
"Feito" aqui.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4, Drizzle ORM + Neon
(Postgres), Vercel Blob (upload da nota fiscal), Resend (e-mail), auth
própria (bcrypt + JWT em cookie httpOnly).

## Estado do deploy

- **GitHub** (privado): `https://github.com/karinavf83-commits/nova-medtec-boletos`
  — branch `main`.
- **Vercel**: `https://nova-medtec-boletos.vercel.app/` — projeto
  `projeto-fluxo-de-caixa/nova-medtec-boletos` (Hobby).
- **Neon** (Postgres): um único projeto agora (`still-pine-81773522`, host
  `ep-bold-field-axjjubk7`) — dois projetos duplicados/vazios de uma sessão
  anterior confusa foram apagados em 2026-08-18. Schema com 5 tabelas:
  `users`, `sessions`, `user_passwords`, `boleto_requests`,
  `credit_analysis_requests`.
- **Vercel Blob**: store `nova-medtec-boletos-public`
  (`store_efFXItreTdWZMkiV`), acesso **público** (um store anterior com
  acesso privado causava falha silenciosa no upload — já corrigido).
- **Resend**: `novamedtec.com.br` cadastrado mas **ainda não verificado**
  (ver pendências). `EMAIL_FROM` continua no sandbox `onboarding@resend.dev`
  por enquanto.
- **Contas de admin reais**: `karinavf83@gmail.com` (Karina) e
  `renata.maciel@novamedtec.com.br` (Renata), ambas já cadastradas com senha
  própria. **Não existe fluxo de "esqueci minha senha"** — se alguma travar
  o login, a solução é apagar a linha da tabela `users` no Postgres pra
  poder cadastrar de novo.

## ⚠️ Detalhes de infra que não são óbvios lendo o código

1. **`vercel deploy --prod` não atualiza sozinho o alias
   `nova-medtec-boletos.vercel.app`** — ele só atualiza os alias automáticos
   (`-git-main-...` e o do projeto). Depois de todo deploy é preciso rodar
   manualmente:
   ```
   vercel alias set <url-do-deploy-novo> nova-medtec-boletos.vercel.app
   ```
   Senão o site em produção fica desatualizado mesmo com o deploy "pronto".
2. **O login do `vercel` CLI expira mais ou menos a cada dia.** Se um
   `vercel deploy` falhar com `"Not authorized"` logo no início de uma nova
   sessão, não precisa investigar nada — só rodar `vercel login` de novo
   (abre link de autorização) e repetir o deploy.
3. **A senha do banco Neon já foi rotacionada uma vez** (2026-08-18), depois
   que a senha real vazou num commit do `.env.example` no GitHub (commits
   `0ebe958`/`e775938`, deixados no histórico porque não foi pedido pra
   reescrever). A senha antiga não funciona mais.
4. Havia duas cópias da pasta do projeto (`OneDrive` e
   `Downloads/theubolso-app_4`) que ficaram dessincronizadas numa sessão
   anterior — foram unificadas via merge do Git em 2026-08-18. Se abrir o
   projeto por outro caminho/ferramenta (ex: Antigravity), rodar `git
   status`/`git pull` antes de assumir que está tudo igual a esta cópia.

## Pendências em aberto

- **Verificar domínio no Resend**: falta adicionar os registros DNS (DKIM
  TXT, MX, SPF TXT — ver painel do Resend) no provedor onde
  `novamedtec.com.br` está hospedado. Até lá, e-mail de notificação só
  chega na própria conta Resend, não pros clientes/lojas de verdade.
- **`deverr.log` e `devout.log` commitados por engano** (vieram de uma
  sessão do Antigravity) — arquivos de log não deveriam estar versionados;
  ainda não removidos, sem decisão tomada.
- **Painel de Análise de Crédito não tem exportar CSV** (o de Boletos tem) —
  não foi pedido ainda, mas é fácil de replicar se precisar.
- **Sem fluxo de "esqueci minha senha"** em nenhuma das contas (ver acima).

## Estrutura do projeto (referência rápida)

```
src/app/                       página pública de boleto (/), análise de
                                crédito (/analise-credito), login,
                                registrar, painel (/painel, /painel/credito)
src/app/api/auth/               login, registro, sessão, logout
src/app/api/boleto-requests/    criar, listar (filtros+resumo), status,
                                 export CSV
src/app/api/credit-analysis/    criar, listar (filtros+resumo), status
src/app/api/upload/             token de upload para o Vercel Blob
src/lib/auth/                   sessão (JWT+cookie), senha (bcrypt), allowlist
src/lib/db/                     schema Drizzle + cliente Postgres
src/lib/email.ts                envio de e-mail (Resend), boleto e crédito
src/lib/stores.ts               lista das 22 lojas ativas (fonte: planilha)
src/lib/masks.ts                máscaras de CNPJ/CPF, telefone, moeda
src/lib/installment-plan.ts     regra de parcelamento (15/30/45, 30/60/90)
src/components/                 componentes de UI (Tailwind), BrandHeader,
                                 PublicNav (telas públicas), PanelNav (admin)
drizzle/                        schema SQL
README.md                       guia de setup completo (Neon/Blob/Resend/Vercel)
```

Scripts úteis: `npm run dev`, `npm run build`, `npm run db:push`,
`npm run db:studio` (explorar o banco visualmente).
