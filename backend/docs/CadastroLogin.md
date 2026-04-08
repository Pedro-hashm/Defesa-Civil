# Documentacao - Cadastro e Login

Este documento descreve como foi implementada a autenticacao no backend, cobrindo:

- Endpoint de cadastro
- Endpoint de login
- Onde os dados sao salvos no banco
- Como a senha e protegida com hash
- Estrutura de resposta da API

## Visao Geral

Foi criado um modulo de autenticacao em `src/modules/Auth` com os arquivos:

- `auth.dto.ts`
- `auth.service.ts`
- `auth.controller.ts`
- `auth.routes.ts`

As rotas foram registradas no roteador principal em `src/routes/index.ts` com o prefixo `/auth`.

## Endpoints

### 1) Cadastro

- Metodo: `POST`
- Rota: `/auth/cadastro`

Body esperado:

```json
{
	"nome": "Maria Silva",
	"email": "maria@email.com",
	"senha": "123456",
	"cargo": "ALUNO"
}
```

Observacoes:

- `nome`, `email` e `senha` sao obrigatorios.
- `cargo` e opcional. Se nao for enviado, o sistema usa `ALUNO`.
- O `email` e normalizado (`trim` + lowercase) antes de salvar.

### 2) Login

- Metodo: `POST`
- Rota: `/auth/login`

Body esperado:

```json
{
	"email": "maria@email.com",
	"senha": "123456"
}
```

Observacoes:

- `email` e `senha` sao obrigatorios.
- O `email` tambem e normalizado (`trim` + lowercase).

## Fluxo de Cadastro (o que acontece no backend)

1. O controller recebe os dados e chama `AuthService.cadastro`.
2. O service valida campos obrigatorios.
3. A senha enviada em texto puro (`senha`) nao e salva diretamente.
4. E gerado hash com `bcrypt.hash(..., 10)`.
5. O usuario e salvo na tabela `Usuario` com `senha_hash`.
6. E criado um token de sessao aleatorio com `crypto.randomBytes(48).toString("hex")`.
7. O token e salvo na tabela `Sessao` com data de expiracao de 7 dias.
8. A API retorna token + expiracao + dados publicos do usuario.

## Fluxo de Login (o que acontece no backend)

1. O controller recebe os dados e chama `AuthService.login`.
2. O service busca usuario por `email` na tabela `Usuario`.
3. Se nao encontrar usuario, retorna erro de credenciais invalidas.
4. Se o usuario estiver inativo (`ativo = false`), retorna erro de usuario inativo.
5. A senha enviada e comparada com o hash salvo usando `bcrypt.compare`.
6. Se a senha estiver correta, cria novo token de sessao.
7. Salva nova sessao na tabela `Sessao` com expiracao de 7 dias.
8. Retorna token + expiracao + dados publicos do usuario.

## Onde os dados sao salvos no banco

### Tabela `Usuario`

No cadastro, e criado um registro com:

- `nome`
- `email`
- `senha_hash` (resultado do bcrypt)
- `cargo` (`ADMIN` ou `ALUNO`)
- `ativo` (true)
- `criado_em` (automatico no Prisma)

Importante:

- A senha em texto puro nunca vai para o banco.
- O campo salvo e sempre `senha_hash`.

### Tabela `Sessao`

No cadastro e no login, e criado um registro de sessao com:

- `usuario_id`
- `token`
- `expira_em`
- `criado_em` (automatico)

Isso permite controlar autenticacao por token com expiracao.

## Resposta de Sucesso (cadastro e login)

Exemplo:

```json
{
	"token": "<token_hex>",
	"expira_em": "2026-04-15T12:00:00.000Z",
	"usuario": {
		"id": 1,
		"nome": "Maria Silva",
		"email": "maria@email.com",
		"cargo": "ALUNO",
		"ativo": true,
		"criado_em": "2026-04-08T12:00:00.000Z"
	}
}
```

## Tratamento de Erros

- Cadastro com email duplicado: retorna erro informando email ja cadastrado.
- Login com email/senha invalidos: retorna erro de credenciais invalidas.
- Login com usuario inativo: retorna erro de usuario inativo.
- Campos obrigatorios ausentes: retorna erro de validacao.

## Arquivos Envolvidos na Implementacao

- `src/modules/Auth/auth.dto.ts`
- `src/modules/Auth/auth.service.ts`
- `src/modules/Auth/auth.controller.ts`
- `src/modules/Auth/auth.routes.ts`
- `src/routes/index.ts`

## Observacao Tecnica

O token de sessao esta sendo gerado e salvo no banco, mas ainda nao existe middleware de protecao de rotas validando esse token em todas as rotas privadas. Isso pode ser implementado na proxima etapa.
