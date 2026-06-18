# Documentação do Projeto — Defesa Civil (Treinamento)

> Plataforma de simulação e treinamento para preenchimento de formulários oficiais da Defesa Civil, no padrão SINPDEC / SEDEC-MIDR.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Tecnologias](#3-tecnologias)
4. [Estrutura de pastas](#4-estrutura-de-pastas)
5. [Como executar o projeto](#5-como-executar-o-projeto)
6. [Variáveis de ambiente](#6-variáveis-de-ambiente)
7. [Banco de dados](#7-banco-de-dados)
8. [Formulários e simuladores](#8-formulários-e-simuladores)
9. [Fluxos principais](#9-fluxos-principais)
10. [API REST](#10-api-rest)
11. [Autenticação, papéis e segurança](#11-autenticação-papéis-e-segurança)
12. [Frontend — rotas e telas](#12-frontend--rotas-e-telas)
13. [Testes automatizados](#13-testes-automatizados)
14. [Documentação complementar](#14-documentação-complementar)
15. [Observações operacionais](#15-observações-operacionais)

---

## 1. Visão geral

O sistema permite que **alunos** pratiquem o preenchimento de formulários oficiais em ambiente controlado e que **administradores/supervisores** acompanhem, corrijam e aprovem as tentativas enviadas.

### Objetivos

- Treinar o preenchimento de formulários reais (FIDE, DMATE, Solicitação de Recursos).
- Simular o ciclo completo: envio → avaliação → correção → reenvio → aprovação.
- Gerenciar usuários, comunicados institucionais e ordens/corpos associados.
- Gerar visualização/impressão em PDF das respostas aprovadas.

### Papéis de usuário

| Cargo   | Descrição |
|---------|-----------|
| `ADMIN` | Supervisor: gerencia usuários, comunicados, ordens, avalia respostas dos alunos. |
| `ALUNO` | Preenche simuladores, acompanha status e corrige tentativas com feedback. |

---

## 2. Arquitetura

```
┌─────────────────┐      HTTP/JSON       ┌─────────────────┐      Prisma      ┌──────────────┐
│  Frontend       │ ◄──────────────────► │  Backend API    │ ◄────────────► │  PostgreSQL  │
│  Next.js 16     │   Bearer token       │  Express 5      │                │  (Docker)    │
│  React 19       │                      │  Node.js        │                └──────────────┘
└─────────────────┘                      └─────────────────┘
        │
        │ Middleware (cookies)
        ▼
   proxy.ts — controle de rotas por cargo
```

- **Monorepo** com `frontend/` e `backend/` na raiz.
- **API stateless** com sessões persistidas no banco (`Sessao`).
- **Formulários flexíveis**: estrutura e respostas em JSON (`Formulario.estrutura`, `TentativaFormulario.respostas`).
- **Sem armazenamento de arquivos**: mapas GeoJSON e respostas ficam em colunas JSON.

---

## 3. Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Mapa (FIDE) | Leaflet + Geoman (OpenStreetMap) |
| Backend | Node.js, Express 5, TypeScript |
| ORM | Prisma 4.16 |
| Banco | PostgreSQL 15 (Docker) |
| Autenticação | Sessão por token + bcrypt + SHA-256 no cliente |
| Testes | Vitest (frontend e backend) |
| Container | Docker Compose |

---

## 4. Estrutura de pastas

```
defesa-civil/
├── docker-compose.yml          # PostgreSQL
├── readme.md                   # Guia rápido de instalação
│
├── backend/
│   ├── docs/                   # Documentação técnica (este arquivo e módulos)
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos do banco
│   │   ├── seed.ts             # Admin padrão + formulários FIDE/DMATE/Recursos
│   │   └── migrations/         # Histórico de alterações do banco
│   └── src/
│       ├── server.ts           # Entrada da API (porta 8080)
│       ├── routes/             # Agregador de rotas
│       ├── config/             # Prisma, password utils
│       ├── middlewares/        # auth, roles
│       └── modules/
│           ├── Auth/           # Login, convites, reset de senha
│           ├── Usuario/        # CRUD de usuários
│           ├── Comunicado/     # Mural de comunicados
│           ├── Ordem/          # Ordens/corpos
│           └── Formulario/     # Formulários e tentativas
│
└── frontend/
    ├── app/                    # App Router (Next.js)
    │   ├── page.tsx            # Login
    │   ├── (painel)/           # Área autenticada
    │   └── imprimir/[id]/      # PDF/visualização
    ├── components/
    │   └── forms/              # Fide, Dmate, Recursos
    ├── lib/                    # Utilitários (tentativas, geojson, formularios…)
    ├── services/               # authService, simuladorService
    └── proxy.ts                # Middleware de proteção de rotas
```

---

## 5. Como executar o projeto

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm

### Passo a passo

```bash
# 1. Clonar e entrar na pasta
git clone <url-do-repositorio>
cd defesa-civil

# 2. Subir o banco
docker-compose up -d

# 3. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
# API em http://localhost:8080

# 4. Frontend (outro terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
# App em http://localhost:3000
```

### Credenciais padrão (seed)

| Campo | Valor |
|-------|-------|
| E-mail | `admin@defesacivil.com` |
| Senha  | `Admin@123` |

---

## 6. Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Conexão PostgreSQL. Ex.: `postgresql://postgres:123456@localhost:5433/defesa_civil` |
| `FRONTEND_URL` | URL base do front para links de convite/reset. Ex.: `http://localhost:3000` |
| `PASSWORD_PREFIXO` | Prefixo de servidor aplicado ao hash antes do bcrypt |
| `PASSWORD_SUFIXO` | Sufixo de servidor aplicado ao hash antes do bcrypt |
| `RECAPTCHA_SECRET_KEY` | Chave secreta reCAPTCHA v2 (opcional em dev) |
| `SEED_SENHA_PREFIXO` / `SEED_SENHA_SUFIXO` | Prefixo/sufixo usados no seed para gerar hash do admin |

### Frontend (`frontend/.env.local`)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL da API. Ex.: `http://localhost:8080` |
| `NEXT_PUBLIC_SENHA_PREFIXO` | Prefixo aplicado à senha antes do SHA-256 no browser |
| `NEXT_PUBLIC_SENHA_SUFIXO` | Sufixo aplicado à senha antes do SHA-256 no browser |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Site key do reCAPTCHA v2 |

---

## 7. Banco de dados

### Modelos principais

| Modelo | Função |
|--------|--------|
| `Usuario` | Contas com cargo `ADMIN` ou `ALUNO`, bloqueio por tentativas, vínculo opcional com `Ordem` |
| `Sessao` | Tokens de autenticação com expiração |
| `ConviteRegistro` | Links de cadastro gerados pelo admin |
| `RecuperacaoSenha` | Tokens de redefinição de senha |
| `Comunicado` | Avisos publicados no mural |
| `Ordem` | Corpos/organizações vinculáveis a usuários |
| `Formulario` | Catálogo de formulários (metadados + estrutura JSON) |
| `TentativaFormulario` | Respostas do aluno, status e feedback do supervisor |

### Status de tentativa

| Status | Significado |
|--------|-------------|
| `INICIADO` | Rascunho ou aguardando avaliação |
| `FINALIZADO` | Aprovado pelo supervisor |
| `ERRO` | Devolvido com feedback para correção |

### Seed de formulários

O `prisma/seed.ts` cria/atualiza três formulários padrão:

| Formulário | `documento` na estrutura | Uso |
|------------|--------------------------|-----|
| FIDE — Padrão (SEDEC/MIDR) | `FIDE` | Informações do desastre |
| DMATE — Padrão (SEDEC/MIDR) | `DMATE` | Atuação emergencial municipal |
| Solicitação de Recursos — Padrão (SEDEC/MIDR) | `SOLICITACAO_RECURSOS` | Ajuda humanitária e metas |

> Após atualizar o seed, execute: `npx prisma db seed`

---

## 8. Formulários e simuladores

### FIDE + DMATE (simulador integrado)

- **Rota:** `/simulador/fide-dmate`
- **Componentes:** `Fide.tsx`, `Dmate.tsx`
- **Respostas salvas:** `{ fide: {...}, dmate: {...} }`
- **Recursos:** mapa Leaflet com polígonos GeoJSON na seção de áreas afetadas
- **Impressão:** `/imprimir/[id]` renderiza FIDE e DMATE

### Solicitação de Recursos

- **Rota:** `/simulador/solicitar-recursos`
- **Componente:** `Recursos.tsx`
- **Respostas salvas:** `{ solicitacao_recursos: {...} }`
- **Campos principais:** UF, COBRADE, data da ocorrência, tipo de solicitação, população afetada, meta e itens com valores
- **ID do formulário:** resolvido dinamicamente via API (`obterIdFormularioRecursos`)

### Detecção de tipo

O utilitário `frontend/lib/formularios.ts` identifica o tipo da tentativa pelo conteúdo de `respostas` (prioridade) ou pelo título do formulário, permitindo corrigir tentativas antigas salvas com `formulario_id` incorreto.

---

## 9. Fluxos principais

### 9.1 Login

1. Aluno/admin informa e-mail e senha na tela inicial.
2. Frontend aplica SHA-256 com prefixo/sufixo e envia hash + token reCAPTCHA.
3. Backend valida credenciais, cria sessão e retorna token.
4. Token e cargo são gravados em `localStorage` e cookies (`defesa-civil.token`, `defesa-civil.cargo`).
5. Middleware `proxy.ts` protege rotas do painel.

### 9.2 Simulação e envio (aluno)

1. Aluno escolhe simulador em `/simulador`.
2. Preenche formulário e envia (status `INICIADO`) ou salva rascunho.
3. Tentativa fica visível em `/minhas-respostas`.

### 9.3 Avaliação (supervisor)

1. Admin acessa `/respostas`.
2. Visualiza resumo, abre PDF em `/imprimir/[id]`.
3. **Aprova** (`FINALIZADO`) ou **aponta erros** (`ERRO` + texto em `erros`).
4. Aluno vê feedback e corrige pela rota correta do formulário.

### 9.4 Cadastro por convite

1. Admin gera convite em `/usuarios`.
2. Novo usuário acessa `/register?token=...`.
3. Backend valida convite, cria conta e inicia sessão.

> Detalhes em [AutenticacaoSeguranca.md](./AutenticacaoSeguranca.md) e [CadastroLogin.md](./CadastroLogin.md).

---

## 10. API REST

Base URL: `http://localhost:8080`

### Autenticação (`/auth`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/login` | — | Login |
| POST | `/auth/cadastro` | — | Cadastro direto (legado) |
| POST | `/auth/forgot-password` | — | Solicitar reset |
| POST | `/auth/reset-password` | — | Redefinir senha |
| GET | `/auth/convite/:token` | — | Validar convite |
| POST | `/auth/registrar` | — | Registrar com convite |
| POST | `/auth/convite` | ADMIN | Criar convite |
| GET | `/auth/me` | Auth | Dados do usuário logado |

### Usuários (`/usuarios`) — ADMIN

CRUD, ativar/desativar, gerar link de reset, desbloquear conta.

### Comunicados (`/comunicados`)

Listagem pública autenticada; criação/edição/remoção por ADMIN.

### Ordens (`/ordens`)

CRUD de ordens/corpos; listagem de ativas para selects.

### Formulários (`/formularios`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/formularios` | Lista formulários ativos |
| GET | `/formularios/:id` | Detalhe com estrutura |

### Tentativas (`/tentativas`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/tentativas` | Auth | Lista do usuário (ALUNO: próprias; ADMIN: todas) |
| GET | `/tentativas/supervisor` | ADMIN | Lista para painel do supervisor |
| GET | `/tentativas/:id` | Auth | Detalhe (com regra de propriedade) |
| POST | `/tentativas` | ALUNO | Criar tentativa |
| PUT | `/tentativas/:id` | Auth | Atualizar respostas/status/erros |
| DELETE | `/tentativas/:id` | Auth | Remover tentativa |

**Header de autenticação:**

```
Authorization: Bearer <token>
```

---

## 11. Autenticação, papéis e segurança

### Camadas de proteção da senha

```
Senha digitada
  → SHA-256(PREFIXO_FRONT + senha + SUFIXO_FRONT)   [browser]
  → PREFIXO_SRV + hash + SUFIXO_SRV                 [servidor]
  → bcrypt                                            [armazenado]
```

### Middlewares

| Arquivo | Função |
|---------|--------|
| `auth.middleware.ts` | Valida token de sessão e anexa `req.usuario` |
| `roles.middleware.ts` | Restringe rotas por cargo (`ADMIN`, `ALUNO`) |
| `frontend/proxy.ts` | Redireciona por cookie quando não autenticado ou sem permissão |

### Regras de rota no frontend (`proxy.ts`)

| Cargo | Rotas permitidas |
|-------|------------------|
| Público | `/`, `/register`, `/forgot-password`, `/reset-password` |
| `ALUNO` | `/simulador`, `/minhas-respostas`, `/comunicados` |
| `ADMIN` | Todas exceto `/minhas-respostas` |

### Bloqueio por tentativas de login

Após 5 tentativas incorretas, a conta é bloqueada por 15 minutos.

> Documentação completa: [AutenticacaoSeguranca.md](./AutenticacaoSeguranca.md)

---

## 12. Frontend — rotas e telas

### Públicas

| Rota | Tela |
|------|------|
| `/` | Login |
| `/register` | Cadastro por convite |
| `/forgot-password` | Esqueci minha senha |
| `/reset-password` | Redefinir senha |

### Painel autenticado

| Rota | Acesso | Função |
|------|--------|--------|
| `/comunicados` | Todos | Mural de avisos |
| `/comunicados/criar` | ADMIN | Novo comunicado |
| `/comunicados/[id]/editar` | ADMIN | Editar comunicado |
| `/simulador` | Todos | Hub de simuladores |
| `/simulador/fide-dmate` | Todos | FIDE + DMATE |
| `/simulador/solicitar-recursos` | Todos | Solicitação de Recursos |
| `/minhas-respostas` | ALUNO | Histórico e correções |
| `/respostas` | ADMIN | Avaliação de alunos |
| `/usuarios` | ADMIN | Gestão de usuários |
| `/ordens` | ADMIN | Gestão de ordens |
| `/imprimir/[id]` | Auth | Visualização/PDF |

### Bibliotecas utilitárias relevantes

| Arquivo | Responsabilidade |
|---------|------------------|
| `lib/tentativas.ts` | API de tentativas, montagem FIDE/DMATE, catálogo |
| `lib/formularios.ts` | Detecção de tipo, rotas de edição, resumo de recursos |
| `lib/geojson.ts` | Validação e parsing de GeoJSON |
| `lib/fideAdapter.ts` | Conversão JSON aninhado → campos flat do FIDE |
| `lib/passwordUtils.ts` | Hash e validação de senha no cliente |
| `services/authService.ts` | Endpoints de autenticação |

---

## 13. Testes automatizados

### Backend

```bash
cd backend
npm test          # execução única
npm run test:watch
```

Cobertura: `password`, middlewares, services (Auth, Usuario, Ordem, Comunicado, Formulario).

### Frontend

```bash
cd frontend
npm test
npm run test:watch
```

Cobertura: utilitários (`lib/`), services, middleware `proxy.ts`.

Padrão: arquivos `*.test.ts` co-localizados ou em pastas `tests/`.

---

## 14. Documentação complementar

| Documento | Conteúdo |
|-----------|----------|
| [AutenticacaoSeguranca.md](./AutenticacaoSeguranca.md) | Senha, convites, reset, reCAPTCHA, bloqueio |
| [CadastroLogin.md](./CadastroLogin.md) | Fluxo de cadastro e login |
| [Comunicados.md](./Comunicados.md) | Módulo de comunicados |
| [AtivacaoDesativacao.md](./AtivacaoDesativacao.md) | Ativar/desativar usuários |
| [Feedback.md](./Feedback.md) | Ciclo de avaliação supervisor ↔ aluno |
| [Mapa.md](./Mapa.md) | Mapa de áreas afetadas (referência; implementação atual usa Leaflet/OSM) |

---

## 15. Observações operacionais

- O banco roda em Docker na porta **5433** (mapeada para 5432 no container).
- A API escuta na porta **8080**; o frontend na **3000**.
- Dados de produção **não** são versionados; o schema evolui via **migrations**.
- Comunicados e tentativas usam JSON flexível — novos campos de formulário podem ser adicionados sem migration, desde que o front e as validações estejam alinhados.
- Para novos ambientes, altere obrigatoriamente os segredos de senha (`PASSWORD_*`, `NEXT_PUBLIC_SENHA_*`) e configure reCAPTCHA real em produção.
- A sidebar do painel usa cores institucionais fixas (`#003882`) independente do tema do sistema operacional.

---

*Documento gerado como referência central do projeto. Para alterações de schema, execute `npx prisma migrate dev` e atualize este arquivo se necessário.*
