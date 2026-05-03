# Documentacao - Ativacao e Desativacao de Usuarios

Este documento descreve a funcionalidade de ativar e desativar usuarios no backend.

Escopo:
- Banco de dados
- Regras de negocio
- Endpoints
- Exemplos de requisicao e resposta

Nao cobre frontend.

## Visao Geral

A funcionalidade foi implementada no modulo de Usuario com dois endpoints dedicados:

- `PATCH /usuarios/:id/ativar`
- `PATCH /usuarios/:id/desativar`

Essas rotas estao protegidas por:
- `authMiddleware` (token obrigatorio)
- `rolesMiddleware("ADMIN")` (somente ADMIN)

## Regras de Negocio

1. Somente usuarios ADMIN podem ativar/desativar outros usuarios.
2. Ao desativar um usuario:
- `ativo` passa para `false` na tabela `Usuario`.
- Todas as sessoes desse usuario sao removidas da tabela `Sessao`.
- Resultado pratico: logout forcado imediato.
3. Ao ativar um usuario:
- `ativo` passa para `true` na tabela `Usuario`.
- Nao recria sessoes antigas; o usuario precisa logar novamente.
4. Se o usuario nao existir, a API retorna `404`.

## Impacto no Banco de Dados


- Tabela: `Usuario`
- Campo: `ativo Boolean @default(true)`

Operacoes executadas:
- Update em `Usuario.ativo`
- DeleteMany em `Sessao` quando desativar

## Endpoints

### 1) Ativar usuario

- Metodo: `PATCH`
- Rota: `/usuarios/:id/ativar`
- Autenticacao: obrigatoria (`Bearer token`)
- Autorizacao: `ADMIN`

#### Exemplo

```bash
curl -X PATCH "http://localhost:8080/usuarios/10/ativar" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

#### Resposta de sucesso (`200`)

```json
{
  "message": "Usuario ativado com sucesso.",
  "usuario": {
    "id": 10,
    "nome": "Aluno Teste",
    "email": "aluno.teste@exemplo.com",
    "cargo": "ALUNO",
    "ativo": true,
    "criado_em": "2026-04-22T14:20:00.000Z"
  }
}
```

### 2) Desativar usuario

- Metodo: `PATCH`
- Rota: `/usuarios/:id/desativar`
- Autenticacao: obrigatoria (`Bearer token`)
- Autorizacao: `ADMIN`

#### Exemplo

```bash
curl -X PATCH "http://localhost:8080/usuarios/10/desativar" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

#### Resposta de sucesso (`200`)

```json
{
  "message": "Usuario desativado com sucesso.",
  "usuario": {
    "id": 10,
    "nome": "Aluno Teste",
    "email": "aluno.teste@exemplo.com",
    "cargo": "ALUNO",
    "ativo": false,
    "criado_em": "2026-04-22T14:20:00.000Z"
  }
}
```

## Erros Esperados

### Usuario nao encontrado

Status: `404`

```json
{
  "error": "Usuario nao encontrado."
}
```

### Sem token

Status: `401`

```json
{
  "error": "Token nao fornecido."
}
```

### Token invalido/expirado

Status: `401`

```json
{
  "error": "Token invalido."
}
```

ou

```json
{
  "error": "Token expirado."
}
```

### Usuario sem permissao de ADMIN

Status: `403`

```json
{
  "error": "Acesso negado. Cargo insuficiente."
}
```

## Validacao Funcional Recomendada

1. Logar como ADMIN e obter token.
2. Criar ou escolher um usuario ALUNO ativo.
3. Chamar `PATCH /usuarios/:id/desativar`.
4. Tentar login com o usuario desativado e validar erro de usuario inativo.
5. Chamar `PATCH /usuarios/:id/ativar`.
6. Validar que o login volta a funcionar.

## Arquivos Envolvidos

- `src/modules/Usuario/usuario.routes.ts`
- `src/modules/Usuario/usuario.controller.ts`
- `src/modules/Usuario/usuario.service.ts`
- `src/routes/index.ts`
- `prisma/schema.prisma`
