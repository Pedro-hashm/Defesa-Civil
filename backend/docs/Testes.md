# Testes — Backend Defesa Civil

## Visão Geral

| Categoria | Arquivos | Testes |
|---|---|---|
| Config | 1 | 5 |
| Middlewares | 2 | 8 |
| Services (unitários) | 5 | 65 |
| Controllers (unitários) | 5 | 84 |
| Rotas (integração) | 5 | 89 |
| **Total** | **18** | **251** |

**Framework:** [Vitest](https://vitest.dev/) v3  
**Integração HTTP:** [Supertest](https://github.com/ladjs/supertest)  
**Banco de dados:** nenhum acesso real — Prisma é mockado via `vi.mock`

---

## Como Executar

```bash
cd Defesa-Civil/backend

# Roda todos os testes uma vez
npm test

# Modo watch (re-executa ao salvar)
npm run test:watch
```

---

## Estratégia por Camada

### Config
Testa funções puras sem dependências externas.

### Middlewares
Mock do Prisma + objetos `req`/`res` sintéticos. Sem Express, sem HTTP.

### Services (unitários)
Mock completo do Prisma via `vi.hoisted` + `vi.mock("../../config/prisma")`.  
Cada service é instanciado direto no teste; nenhum módulo vizinho é carregado.

### Controllers (unitários)
Mock do service correspondente via `vi.mock("./[nome].service")`.  
O controller é instanciado e seus métodos são chamados com `req`/`res` sintéticos.  
Valida: status HTTP correto, corpo da resposta, tratamento de erros do service.

### Rotas (integração)
- **Prisma:** mockado apenas em `sessao.findFirst` (usado pelo `authMiddleware`).
- **Service:** mockado na totalidade para isolar regras de negócio.
- **HTTP real:** usa `supertest` sobre o app Express completo (`createApp()`).
- **Valida:** routing correto, enforcement de `authMiddleware`, enforcement de `rolesMiddleware`, mapeamento de status HTTP e corpo.

---

## Arquivos de Teste

### Config

#### [`src/config/password.test.ts`](../src/config/password.ts)
| Teste | O que verifica |
|---|---|
| `aplicarPepper` envolve hash com prefixo/sufixo | Concatenação correta de variáveis de ambiente |
| Senha válida aceita | Todas as regras satisfeitas |
| Senha sem maiúscula rejeita | Regra de maiúscula |
| Senha sem caractere especial rejeita | Regra de especial |
| Senha curta rejeita | Mínimo de 8 caracteres |

---

### Middlewares

#### [`src/middlewares/auth.middleware.test.ts`](../src/middlewares/auth.middleware.ts)
| Teste | Status esperado |
|---|---|
| Sem header `Authorization` | 401 |
| Token inexistente no banco | 401 |
| Token expirado | 401 |
| Usuário inativo | 401 |
| Sessão válida → `next()` chamado e `req.usuario` preenchido | — |

#### [`src/middlewares/roles.middleware.test.ts`](../src/middlewares/roles.middleware.ts)
| Teste | Status esperado |
|---|---|
| Sem `req.usuario` | 401 |
| Cargo não incluído na lista de permitidos | 403 |
| Cargo incluído → `next()` chamado | — |

---

### Services (unitários)

#### [`src/config/password.test.ts`](../src/config/password.ts)
Testa `validarForcaSenha` e `aplicarPepper`.

#### [`src/modules/Auth/auth.service.test.ts`](../src/modules/Auth/auth.service.ts)
**20 testes** — Cobre todos os fluxos do `AuthService`:

| Bloco | Casos |
|---|---|
| `cadastro` | sucesso; campos ausentes; senha fraca |
| `login` | credenciais válidas; usuário inexistente; inativo; conta bloqueada; incremento de tentativas; bloqueio após limite |
| `forgotPassword` | resposta genérica (e-mail inexistente); cria token para ativo |
| `resetPassword` | redefine com token válido; rejeita token expirado |
| `gerarLinkResetAdmin` | gera link; falha se usuário não existe |
| `criarConvite` | cria e retorna link |
| `validarConvite` | dados do convite válido; rejeita expirado |
| `registrarComConvite` | registra e consome convite; rejeita e-mail diferente do convite |

#### [`src/modules/Comunicado/comunicado.service.test.ts`](../src/modules/Comunicado/comunicado.service.ts)
**9 testes**

| Bloco | Casos |
|---|---|
| `create` | trim de campos; campos obrigatórios ausentes |
| `getAll` | lista ordenada por data desc |
| `update` | atualiza campos válidos; título vazio; sem campos; P2025 propagado |
| `delete` | remove existente; P2025 propagado |

#### [`src/modules/Formulario/formulario.service.test.ts`](../src/modules/Formulario/formulario.service.ts)
**20 testes** — Inclui validação de GeoJSON:

| Bloco | Casos |
|---|---|
| `listarFormularios` | filtra apenas ativos |
| `buscarFormulario` | busca ativo por ID |
| `criarTentativa` | objeto de respostas válido; array rejeitado; formulário inativo; `Prisma.JsonNull` para `erros: null`; normaliza GeoJSON em `fide.mapa_geojson`; rejeita polígono não fechado |
| `listarTentativas` | ALUNO filtra por `usuario_id`; ADMIN lista todas |
| `buscarTentativa` | ALUNO dono; null para inexistente; ALUNO não-dono → erro; ADMIN acessa qualquer |
| `atualizarTentativa` | ALUNO dono atualiza; P2025 para inexistente; sem campos → erro |
| `deletarTentativa` | ALUNO dono remove; P2025 para inexistente; ALUNO não-dono bloqueado |

#### [`src/modules/Ordem/ordem.service.test.ts`](../src/modules/Ordem/ordem.service.ts)
**6 testes**

| Bloco | Casos |
|---|---|
| `create` | nome trimado; nome vazio rejeitado |
| `getAll` / `getAtivas` | lista todas; filtra `ativo: true` |
| `update` | atualiza campos informados |
| `delete` | desvincula usuários (`updateMany`) antes de excluir |

#### [`src/modules/Usuario/usuario.service.test.ts`](../src/modules/Usuario/usuario.service.ts)
**10 testes**

| Bloco | Casos |
|---|---|
| `create` | senha hasheada; cargo obrigatório; senha fraca rejeitada |
| `update` | cargo inválido; atualiza campos |
| `setActive` | remove sessões ao desativar; propaga P2025 |
| `delete` | remove por ID |
| `gerarLinkReset` | delega para `AuthService` |
| `desbloquear` | zera tentativas e `bloqueado_ate` |

---

### Controllers (unitários)

Os testes de controller verificam o mapeamento HTTP: se o service lança um erro ou retorna um valor, o controller deve produzir o status e corpo corretos. O service é **completamente mockado**.

#### [`src/modules/Auth/auth.controller.test.ts`](../src/modules/Auth/auth.controller.ts)
**19 testes**

| Método | Casos |
|---|---|
| `cadastro` | 201 sucesso; 400 P2002 (e-mail duplicado); 400 genérico |
| `login` | 200 sucesso; 401 credenciais inválidas; 401 inativo; 400 outros (bloqueio) |
| `me` | 200 retorna `req.usuario` |
| `forgotPassword` | 200 mensagem genérica; 400 erro |
| `resetPassword` | 200 sucesso; 400 token inválido |
| `criarConvite` | 201 sucesso; 400 erro |
| `validarConvite` | 200 dados do convite; 400 inválido |
| `registrarComConvite` | 201 sucesso; 400 P2002; 400 outros |

#### [`src/modules/Comunicado/comunicado.controller.test.ts`](../src/modules/Comunicado/comunicado.controller.ts)
**12 testes**

| Método | Casos |
|---|---|
| `criar` | 201 (usa `req.usuario.id`); 400 validação |
| `listar` | 200 lista; 200 lista vazia |
| `buscar` | 200 existente; 404 inexistente |
| `atualizar` | 200 sucesso; 404 P2025; 400 sem campos |
| `deletar` | 200 com `message` + `comunicado`; 404 P2025; 400 genérico |

#### [`src/modules/Formulario/formulario.controller.test.ts`](../src/modules/Formulario/formulario.controller.ts)
**21 testes**

| Método | Casos |
|---|---|
| `listarFormularios` | 200 |
| `buscarFormulario` | 200; 404; 400 ID NaN |
| `criarTentativa` | 201 (usa `req.usuario.id`); 400 formulário inativo; 400 respostas inválidas |
| `listarTentativas` | 200 (passa `id` e `cargo` do usuário) |
| `listarTentativasSupervisor` | 200 |
| `buscarTentativa` | 200; 404 null; 403 acesso negado; 400 ID NaN |
| `atualizarTentativa` | 200; 404 P2025; 403 acesso negado; 400 ID NaN |
| `deletarTentativa` | 200 com `message`; 404 P2025; 403 acesso negado; 400 ID NaN |

#### [`src/modules/Ordem/ordem.controller.test.ts`](../src/modules/Ordem/ordem.controller.ts)
**12 testes**

| Método | Casos |
|---|---|
| `criar` | 201; 400 P2002; 400 nome vazio |
| `listar` | 200 |
| `listarAtivas` | 200 |
| `buscar` | 200; 404 |
| `atualizar` | 200; 400 P2002; 400 genérico |
| `deletar` | 200 com `message` + `ordem`; 400 erro |

#### [`src/modules/Usuario/usuario.controller.test.ts`](../src/modules/Usuario/usuario.controller.ts)
**20 testes**

| Método | Casos |
|---|---|
| `criar` | 201; 400 P2002; 400 cargo/senha |
| `listar` | 200 |
| `buscar` | 200; 404 null |
| `atualizar` | 200; 400 cargo inválido |
| `ativar` | 200; 404 P2025 |
| `desativar` | 200; 404 P2025 |
| `deletar` | 200; 400 erro |
| `gerarLinkReset` | 200 com link; 404 P2025; 404 mensagem direta |
| `desbloquear` | 200; 404 P2025; 400 genérico |

---

### Rotas (integração)

Cada arquivo usa `supertest` sobre a aplicação Express completa criada por [`src/__tests__/helpers/create-app.ts`](../src/__tests__/helpers/create-app.ts). O Prisma é mockado apenas em `sessao.findFirst` (necessário para o `authMiddleware`); o service correspondente é mockado por inteiro.

#### [`src/__tests__/integration/auth.routes.test.ts`](../src/__tests__/integration/auth.routes.test.ts)
**19 testes** — Rotas públicas e protegidas de autenticação

Rotas cobertas: `POST /auth/cadastro`, `POST /auth/login`, `GET /auth/me`, `POST /auth/convite`, `GET /auth/convite/:token`, `POST /auth/registrar`, `POST /auth/forgot-password`, `POST /auth/reset-password`

Pontos-chave: `GET /auth/me` exige token válido; `POST /auth/convite` exige ADMIN; demais rotas são públicas.

#### [`src/__tests__/integration/comunicado.routes.test.ts`](../src/__tests__/integration/comunicado.routes.test.ts)
**16 testes** — Leitura autenticada, escrita restrita a ADMIN

| Situação | Esperado |
|---|---|
| GET sem token | 401 |
| GET como ALUNO | 200 |
| POST como ALUNO | 403 |
| POST como ADMIN | 201 |
| PUT como ALUNO | 403 |
| DELETE como ALUNO | 403 |
| DELETE P2025 | 404 |

#### [`src/__tests__/integration/usuario.routes.test.ts`](../src/__tests__/integration/usuario.routes.test.ts)
**14 testes** — Todas as rotas exigem auth + ADMIN

| Situação | Esperado |
|---|---|
| GET sem token | 401 |
| GET como ALUNO | 403 |
| POST (criar) como ADMIN | 201 |
| E-mail duplicado | 400 |
| PATCH ativar/desativar | 200 / 404 P2025 |
| POST gerar-link-reset | 200 / 404 |
| PATCH desbloquear | 200 |
| DELETE | 200 |

#### [`src/__tests__/integration/formulario.routes.test.ts`](../src/__tests__/integration/formulario.routes.test.ts)
**24 testes** — Formulários (leitura geral) + Tentativas (criação exclusiva ALUNO, supervisão ADMIN)

| Rota | Restrição | Casos cobertos |
|---|---|---|
| `GET /formularios` | auth | 401 sem token; 200 autenticado |
| `GET /formularios/:id` | auth | 200; 404; 400 ID inválido |
| `POST /tentativas` | ALUNO only | 401; 403 ADMIN; 201 ALUNO; 400 formulário inativo |
| `GET /tentativas` | auth | 200 ALUNO (filtra próprias); 200 ADMIN (todas) |
| `GET /tentativas/supervisor` | ADMIN | 401; 403 ALUNO; 200 ADMIN |
| `GET /tentativas/:id` | auth | 200; 404; 403 acesso negado |
| `PUT /tentativas/:id` | auth | 200; 404 P2025; 403 acesso negado |
| `DELETE /tentativas/:id` | auth | 200; 403; 404 P2025 |

#### [`src/__tests__/integration/ordem.routes.test.ts`](../src/__tests__/integration/ordem.routes.test.ts)
**16 testes** — `GET /ativas` acessível a qualquer autenticado; demais rotas exigem ADMIN

| Situação | Esperado |
|---|---|
| GET /ativas sem token | 401 |
| GET /ativas como ALUNO | 200 |
| GET /ordens como ALUNO | 403 |
| POST como ADMIN | 201 |
| Nome duplicado (P2002) | 400 |
| GET /:id inexistente | 404 |
| DELETE (desvincula usuários) | 200 |

---

## Helper de Integração

### [`src/__tests__/helpers/create-app.ts`](../src/__tests__/helpers/create-app.ts)

Cria uma instância do app Express idêntica à produção (`server.ts`), mas sem chamar `app.listen`. Usada pelos testes de integração para montar o servidor em memória com `supertest`.

```typescript
import express from "express";
import routes from "../../routes";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(routes);
  return app;
}
```

---

## Padrão de Mock

Todos os mocks usam `vi.hoisted` para garantir que o mock seja definido **antes** da importação do módulo (necessário para módulos com singleton de instância no nível do módulo).

```typescript
// Padrão adotado em todos os arquivos de teste
const mocks = vi.hoisted(() => ({
  metodo: vi.fn(),
}));

vi.mock("./modulo", () => ({
  Classe: vi.fn(() => mocks),
}));

// A importação do módulo testado vem DEPOIS dos vi.mock
import { Modulo } from "./modulo";
```
