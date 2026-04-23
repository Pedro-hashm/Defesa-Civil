# Documentacao - CRUD de Comunicados

Este documento descreve a implementacao do modulo de Comunicados no backend.

Escopo:
- Banco de dados
- Regras de negocio
- Endpoints
- Exemplos de requisicao e resposta


## Visao Geral

Comunicados sao mensagens enviadas por ADMINs para todos os usuarios autenticados da plataforma.

O modulo foi criado em `src/modules/Comunicado` com os arquivos:

- `comunicado.dto.ts`
- `comunicado.service.ts`
- `comunicado.controller.ts`
- `comunicado.routes.ts`

As rotas foram registradas no roteador principal em `src/routes/index.ts` com o prefixo `/comunicados`.

## Banco de Dados

### Tabela `Comunicado`

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | Int (PK) | Identificador unico |
| `autor_id` | Int (FK) | ID do usuario ADMIN que criou |
| `titulo` | String | Titulo do comunicado |
| `conteudo` | String | Corpo do comunicado |
| `publicado_em` | DateTime | Data de criacao (automatico) |
| `atualizado_em` | DateTime | Ultima atualizacao (automatico) |

O campo `autor_id` e uma chave estrangeira para a tabela `Usuario`.

### Alteracao de schema aplicada

O campo `prioridade` (enum `Prioridade`) foi removido do model `Comunicado` e o enum foi dropado do banco, pois nao sera mais utilizado.

Migration aplicada: `20260422000000_remove_prioridade_comunicado`

## Regras de Negocio

1. Somente usuarios ADMIN podem criar, editar e deletar comunicados.
2. Qualquer usuario autenticado pode listar e visualizar comunicados.
3. O `autor_id` e preenchido automaticamente a partir do token JWT do admin logado.
4. `titulo` e `conteudo` sao obrigatorios na criacao.
5. No update, pelo menos um dos campos (`titulo` ou `conteudo`) deve ser enviado.
6. Campos enviados vazios (`""`) sao rejeitados com erro `400`.
7. Comunicados sao listados em ordem decrescente de `publicado_em` (mais recente primeiro).

## Endpoints

### 1) Criar comunicado

- Metodo: `POST`
- Rota: `/comunicados`
- Autenticacao: obrigatoria
- Autorizacao: `ADMIN`

#### Body

```json
{
  "titulo": "Simulacao de evacuacao",
  "conteudo": "Na proxima sexta-feira havera simulacao as 14h."
}
```

#### Exemplo

```bash
curl -X POST "http://localhost:8080/comunicados" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Simulacao de evacuacao", "conteudo": "Na proxima sexta-feira havera simulacao as 14h."}'
```

#### Resposta de sucesso (`201`)

```json
{
  "id": 1,
  "titulo": "Simulacao de evacuacao",
  "conteudo": "Na proxima sexta-feira havera simulacao as 14h.",
  "publicado_em": "2026-04-22T14:00:00.000Z",
  "atualizado_em": "2026-04-22T14:00:00.000Z",
  "autor": {
    "id": 1,
    "nome": "Administrador do Sistema"
  }
}
```

---

### 2) Listar comunicados

- Metodo: `GET`
- Rota: `/comunicados`
- Autenticacao: obrigatoria
- Autorizacao: qualquer cargo

#### Exemplo

```bash
curl -X GET "http://localhost:8080/comunicados" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### Resposta de sucesso (`200`)

```json
[
  {
    "id": 2,
    "titulo": "Aviso importante",
    "conteudo": "...",
    "publicado_em": "2026-04-22T15:00:00.000Z",
    "atualizado_em": "2026-04-22T15:00:00.000Z",
    "autor": { "id": 1, "nome": "Administrador do Sistema" }
  },
  {
    "id": 1,
    "titulo": "Simulacao de evacuacao",
    "conteudo": "...",
    "publicado_em": "2026-04-22T14:00:00.000Z",
    "atualizado_em": "2026-04-22T14:00:00.000Z",
    "autor": { "id": 1, "nome": "Administrador do Sistema" }
  }
]
```

---

### 3) Buscar comunicado por ID

- Metodo: `GET`
- Rota: `/comunicados/:id`
- Autenticacao: obrigatoria
- Autorizacao: qualquer cargo

#### Exemplo

```bash
curl -X GET "http://localhost:8080/comunicados/1" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### Resposta de sucesso (`200`)

Mesmo formato de um item da listagem.

---

### 4) Atualizar comunicado

- Metodo: `PUT`
- Rota: `/comunicados/:id`
- Autenticacao: obrigatoria
- Autorizacao: `ADMIN`

#### Body (todos os campos opcionais, mas ao menos um obrigatorio)

```json
{
  "titulo": "Novo titulo",
  "conteudo": "Novo conteudo atualizado."
}
```

#### Exemplo

```bash
curl -X PUT "http://localhost:8080/comunicados/1" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"conteudo": "Novo conteudo atualizado."}'
```

#### Resposta de sucesso (`200`)

Objeto do comunicado atualizado com o mesmo formato da criacao.

---

### 5) Deletar comunicado

- Metodo: `DELETE`
- Rota: `/comunicados/:id`
- Autenticacao: obrigatoria
- Autorizacao: `ADMIN`

#### Exemplo

```bash
curl -X DELETE "http://localhost:8080/comunicados/1" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

#### Resposta de sucesso (`200`)

```json
{
  "message": "Comunicado deletado com sucesso.",
  "comunicado": {
    "id": 1,
    "titulo": "Simulacao de evacuacao"
  }
}
```

---

## Erros Esperados

### Campos obrigatorios ausentes ou vazios

Status: `400`

```json
{
  "error": "Os campos 'titulo' e 'conteudo' sao obrigatorios."
}
```

### Comunicado nao encontrado

Status: `404`

```json
{
  "error": "Comunicado nao encontrado."
}
```

### Sem token

Status: `401`

```json
{
  "error": "Token nao fornecido."
}
```

### Usuario sem permissao de ADMIN

Status: `403`

```json
{
  "error": "Acesso negado. Cargo insuficiente."
}
```

## Tabela de Endpoints

| Metodo | Rota | Acesso | Descricao |
|---|---|---|---|
| `POST` | `/comunicados` | ADMIN | Cria novo comunicado |
| `GET` | `/comunicados` | Autenticado | Lista todos (ordem decrescente) |
| `GET` | `/comunicados/:id` | Autenticado | Busca por ID |
| `PUT` | `/comunicados/:id` | ADMIN | Atualiza titulo e/ou conteudo |
| `DELETE` | `/comunicados/:id` | ADMIN | Remove permanentemente |

## Arquivos Envolvidos

- `src/modules/Comunicado/comunicado.dto.ts`
- `src/modules/Comunicado/comunicado.service.ts`
- `src/modules/Comunicado/comunicado.controller.ts`
- `src/modules/Comunicado/comunicado.routes.ts`
- `src/routes/index.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260422000000_remove_prioridade_comunicado/migration.sql`
