# Autenticação e Segurança de Senha

> **Módulo:** `backend/src/modules/Auth` e `backend/src/config/password.ts`  
> **Frontend:** `frontend/lib/passwordUtils.ts` e `frontend/services/authService.ts`

---

## Sumário

1. [Criptografia da Senha no Frontend](#1-criptografia-da-senha-no-frontend)
2. [Concatenação no Servidor (Pepper de Servidor)](#2-concatenação-no-servidor-pepper-de-servidor)
3. [Restrições de Força da Senha](#3-restrições-de-força-da-senha)
4. [Confirmação de Senha](#4-confirmação-de-senha)
5. [Sistema de Convites (cadastro via link)](#5-sistema-de-convites-cadastro-via-link)
6. [Redefinição de Senha — Fluxo do Usuário](#6-redefinição-de-senha--fluxo-do-usuário)
7. [Geração de Link de Reset pelo Admin](#7-geração-de-link-de-reset-pelo-admin)
8. [Fluxo Completo de Senha (diagrama)](#8-fluxo-completo-de-senha-diagrama)
9. [reCAPTCHA no Login](#9-recaptcha-no-login)
10. [Limite de Tentativas de Login e Bloqueio](#10-limite-de-tentativas-de-login-e-bloqueio)
11. [Variáveis de Ambiente Necessárias](#11-variáveis-de-ambiente-necessárias)

---

## 1. Criptografia da Senha no Frontend

**Arquivo:** `frontend/lib/passwordUtils.ts` — função `hashSenhaFront`

### O que faz

Antes de qualquer chamada à API (login, cadastro, reset), a senha digitada pelo usuário passa por **concatenação** e **hash**:

```
texto_final = PREFIXO + senha_digitada + SUFIXO
hash = SHA-256(texto_final)
```

Esse hash (64 caracteres hex) é o que trafega pela rede — a senha real **nunca** sai do browser.

### Por que foi implementado assim

- **Concatenação prefixo+sufixo antes do hash:** torna o texto único para este sistema, inútil como rainbow table genérica. O usuário poderia usar a mesma senha em outro sistema sem risco de correlação.
- **Web Crypto API nativa:** disponível em todos os browsers modernos sem dependências externas. Assíncrona e segura.
- **Configurável via variáveis de ambiente** (`NEXT_PUBLIC_SENHA_PREFIXO` e `NEXT_PUBLIC_SENHA_SUFIXO`): os segredos nunca são hardcoded e podem ser rotacionados por ambiente.

### Onde é aplicado

| Endpoint | Função |
|---|---|
| `POST /auth/login` | `login()` em `authService.ts` |
| `POST /auth/reset-password` | `resetPassword()` em `authService.ts` |
| `POST /auth/registrar` | `registrarComConvite()` em `authService.ts` |

---

## 2. Concatenação no Servidor (Pepper de Servidor)

**Arquivo:** `backend/src/config/password.ts` — função `aplicarPepper`

### O que faz

No backend, antes de passar ao `bcrypt`, o hash recebido do frontend é **envolvido** por um prefixo e sufixo de servidor:

```
texto_final = PREFIXO_SERVIDOR + hash_do_front + SUFIXO_SERVIDOR
senha_hash_final = bcrypt(texto_final, saltRounds=10)
```

### Por que foi implementado assim

- **Segunda camada de concatenação independente:** mesmo que os segredos do frontend vazem, o atacante ainda precisaria dos segredos do servidor para reproduzir o hash armazenado.
- **Prefixo + sufixo (não só sufixo):** envolver o hash em vez de apenas appender aumenta a complexidade do ataque.
- **Configurável via `PASSWORD_PREFIXO` e `PASSWORD_SUFIXO`** no `.env`: nunca hardcoded. Em produção devem ser valores aleatórios longos.
- **bcrypt como última linha:** o bcrypt usa salt aleatório por registro (interno). O pepper/prefixo/sufixo são camadas adicionais, não substituem o bcrypt.

### Funções expostas

```typescript
aplicarPepper(hashDoFront: string): string
// retorna: PREFIXO_SERVIDOR + hashDoFront + SUFIXO_SERVIDOR

validarForcaSenha(senha: string): { valida: boolean; erros: string[] }
```

---

## 3. Restrições de Força da Senha

**Backend:** `backend/src/config/password.ts` — `validarForcaSenha`  
**Frontend:** `frontend/lib/passwordUtils.ts` — `validarForcaSenhaFront`

### Regras aplicadas

| Regra | Regex / Condição |
|---|---|
| Mínimo 8 caracteres | `senha.length >= 8` |
| Pelo menos 1 letra maiúscula | `/[A-Z]/` |
| Pelo menos 1 letra minúscula | `/[a-z]/` |
| Pelo menos 1 número | `/[0-9]/` |
| Pelo menos 1 caractere especial | `/[@#$!%*?&\-_=+<>]/` |

### Por que foi implementado assim

- **Dupla validação (front + back):** o frontend valida em tempo real para UX; o backend valida novamente como garantia de segurança — nunca se confia só no cliente.
- **Feedback visual incremental:** na página de registro e no painel admin, cada regra aparece com ✓ verde ou ○ cinza conforme o usuário digita, reduzindo frustração.
- **Consistência:** as mesmas regras são definidas nas duas camadas para não haver divergência.

### Onde é validado no backend

- `AuthService.cadastro()` — cadastro direto pelo admin
- `AuthService.registrarComConvite()` — cadastro pelo convite
- `AuthService.resetPassword()` — redefinição de senha
- `UsuarioService.hashSenha()` — criação/atualização de usuário pelo painel

---

## 4. Confirmação de Senha

**Frontend:** `frontend/app/register/page.tsx` e `frontend/app/reset-password/page.tsx`

### O que faz

Um segundo campo "Confirmar senha" é exibido ao lado do campo de senha. A submissão do formulário é bloqueada se os dois valores não forem idênticos. O campo muda de cor (vermelho/verde) em tempo real.

### Por que foi implementado assim

- **Prevenção de typo:** evita que o usuário defina uma senha diferente da que pretendia, especialmente importante em campos `type="password"` onde o texto é oculto.
- **Validação client-side pura:** não há custo de rede; a comparação é feita localmente antes de qualquer `fetch`.
- A comparação é feita **antes** do hash — ou seja, compara-se a senha em texto puro digitada nos dois campos. O hash só ocorre após confirmação.

---

## 5. Sistema de Convites (cadastro via link)

### Fluxo

```
Admin → POST /auth/convite { email?, cargo? }
     ← { link, expira_em, cargo }

Link enviado ao futuro usuário:
  https://sistema/register?token=<token_raw>

Usuário acessa /register:
  GET /auth/convite/:token  ← valida sem consumir o token
  ← { email?, cargo, expira_em }

Usuário preenche nome, e-mail, senha, confirmação e submete:
  POST /auth/registrar { token, nome, email, senha_hash }
  ← { token_sessao, usuario }

Usuário é logado automaticamente.
```

### Modelo de dados

```prisma
model ConviteRegistro {
  id            Int       @id @default(autoincrement())
  criado_por_id Int
  token_hash    String    @unique  // SHA-256 do token raw
  email         String?            // restringe a um e-mail específico (opcional)
  cargo         Cargo     @default(ALUNO)
  expira_em     DateTime           // 48 horas após criação
  usado_em      DateTime?          // nulo até ser utilizado
  criado_em     DateTime  @default(now())
  criado_por    Usuario   @relation(...)
}
```

### Por que foi implementado assim

- **Token nunca armazenado em texto puro:** armazena-se apenas o SHA-256 do token. Mesmo com acesso ao banco, não é possível reconstruir o link.
- **Single-use:** ao ser consumido, `usado_em` é preenchido e o token fica inválido.
- **Expiração de 48h:** tempo suficiente para o destinatário receber e usar, sem ficar aberto indefinidamente.
- **E-mail opcional:** se informado, o sistema rejeita registro com e-mail diferente — impede que um link vaze e seja usado por outra pessoa.
- **Cargo pré-definido:** o admin controla qual cargo o novo usuário terá, sem precisar que o usuário saiba ou escolha.
- **Rotas:** `POST /auth/convite` exige `authMiddleware` + `rolesMiddleware("ADMIN")`; `GET /auth/convite/:token` e `POST /auth/registrar` são públicas.

---

## 6. Redefinição de Senha — Fluxo do Usuário

**Rota:** `POST /auth/forgot-password` → `POST /auth/reset-password`  
**Páginas:** `/forgot-password` e `/reset-password`

### Fluxo

```
Usuário → POST /auth/forgot-password { email }
        ← mensagem genérica (sem confirmar se e-mail existe)

Token gerado:
  - 32 bytes aleatórios (crypto.randomBytes)
  - Hash SHA-256 armazenado em RecuperacaoSenha
  - Expira em 15 minutos
  - Link: https://sistema/reset-password?token=<token_raw>

Usuário acessa o link, preenche nova senha + confirmação:
  POST /auth/reset-password { token, nova_senha_hash }
  ← { message: "Senha redefinida com sucesso." }
```

### Por que foi implementado assim

- **Resposta genérica no forgot-password:** independentemente de o e-mail existir ou não, a API retorna a mesma mensagem. Isso previne **user enumeration** — um atacante não consegue descobrir quais e-mails estão cadastrados.
- **Token de uso único:** o campo `usado_em` é preenchido na mesma transação que atualiza a senha.
- **Expiração curta (15 min):** links de reset de senha têm janela mínima para reduzir risco de uso após comprometimento de e-mail.
- **Validação de força na redefinição:** a nova senha passa pelas mesmas regras de complexidade do cadastro.

---

## 7. Geração de Link de Reset pelo Admin

**Rota:** `POST /usuarios/:id/gerar-link-reset`  
**Frontend:** botão "🔑 Link de Reset" na página de usuários

### O que faz

Permite que um administrador gere um link de redefinição de senha para qualquer usuário cadastrado, sem precisar conhecer a senha atual desse usuário. Útil quando:

- Um usuário esqueceu a senha e não tem acesso ao e-mail cadastrado.
- O administrador precisa forçar a troca de senha de um usuário.

### Por que foi implementado assim

- **Reutiliza o modelo `RecuperacaoSenha`:** o link gerado funciona exatamente como o do fluxo `forgot-password`, garantindo consistência.
- **Exige autenticação ADMIN:** `authMiddleware` + `rolesMiddleware("ADMIN")` protegem a rota.
- **Link exibido em modal com botão "Copiar":** o admin visualiza o link gerado na interface e o envia manualmente ao usuário (e-mail, WhatsApp, etc.), sem dependência de serviço SMTP.
- **Mesmo tempo de expiração (15 min):** mantém consistência com o fluxo padrão.

---

## 8. Fluxo Completo de Senha (diagrama)

```
Usuário digita senha
        │
        ▼
[Frontend] validarForcaSenhaFront()  ← feedback visual em tempo real
        │
        ▼
[Frontend] CONCATENA:  PREFIXO + senha + SUFIXO
        │
        ▼
[Frontend] SHA-256(texto_acima)  →  hash_hex (64 chars)
        │
        ▼  (trafega pela rede — nunca a senha real)
[Backend] CONCATENA:  PREFIXO_SRV + hash_hex + SUFIXO_SRV
        │
        ▼
[Backend] bcrypt.hash(resultado, 10)
  senha_hash_final  →  armazenado no banco (campo senha_hash)
```

**Na verificação (login):**

```
[Frontend] PREFIXO + senha_digitada + SUFIXO → SHA-256  →  hash_hex
        │
        ▼
[Backend] PREFIXO_SRV + hash_hex + SUFIXO_SRV  →  resultado
[Backend] bcrypt.compare(resultado, senha_hash_do_banco)  →  true/false
```

---

## 10. Limite de Tentativas de Login e Bloqueio

**Backend:** `auth.service.ts` — método `login`  
**Campos no banco:** `tentativas_login` e `bloqueado_ate` no model `Usuario`

### Como funciona

| Configuração | Valor |
|---|---|
| Máximo de tentativas erradas | **5** |
| Tempo de bloqueio | **15 minutos** |
| Campo no banco | `tentativas_login` (int) + `bloqueado_ate` (DateTime?) |

**Fluxo:**
1. A cada senha incorreta, `tentativas_login` é incrementado.
2. Na 5ª tentativa incorreta, `bloqueado_ate` é definido como `agora + 15 min`.
3. Enquanto `bloqueado_ate > agora`, qualquer tentativa retorna erro com os minutos restantes.
4. Login correto: zera `tentativas_login` e limpa `bloqueado_ate`.
5. Admin pode desbloquear manualmente via `PATCH /usuarios/:id/desbloquear` (botão "🔓 Desbloquear" no painel).

### Por que foi implementado assim

- **Campos na tabela `Usuario`** (em vez de tabela separada): simples, eficiente, sem joins extras.
- **Mensagem com tentativas restantes**: informa o usuário sem revelar se o e-mail existe ou não após a primeira tentativa incorreta.
- **Zeragem no login correto**: evita que um usuário legítimo fique bloqueado após ser alvo de tentativas de força bruta seguidas de login correto.
- **Desbloqueio pelo admin**: útil quando o próprio usuário legítimo errou a senha várias vezes e não pode esperar os 15 minutos.

### Migration necessária

```bash
npx prisma migrate dev --name add-login-lockout
```

---

## 9. reCAPTCHA no Login

**Frontend:** `frontend/app/page.tsx` — componente `ReCAPTCHA`  
**Backend:** `auth.service.ts` — método `verificarRecaptcha`

### O que faz

Antes de processar qualquer tentativa de login, o sistema exige que o usuário resolva o desafio reCAPTCHA v2 do Google ("Não sou um robô"). O token gerado pelo widget é enviado junto com as credenciais e verificado no backend via API do Google antes de qualquer consulta ao banco.

### Fluxo

```
[Frontend] Usuário clica no widget → Google gera token
         │
         ▼
[Frontend] token enviado no body: { email, senha, recaptcha_token }
         │
         ▼
[Backend] POST https://www.google.com/recaptcha/api/siteverify
          { secret: RECAPTCHA_SECRET_KEY, response: recaptcha_token }
         │
         ├─ success: false → lança erro (bloqueia login)
         └─ success: true  → continua o fluxo normal de autenticação
```

### Por que foi implementado assim

- **Proteção contra bots e força bruta:** mesmo com IPs diferentes, um bot precisaria resolver o desafio visual em cada tentativa.
- **Verificação no servidor:** verificar apenas no frontend seria contornável; a validação via API do Google no backend garante que o token é legítimo.
- **Widget resetado em falha:** após erro de login, o reCAPTCHA é resetado automaticamente — o usuário deve clicar novamente antes de tentar outra vez.
- **`hl="pt-BR"`:** widget exibido em português.
- **Graceful degradation em dev:** se `RECAPTCHA_SECRET_KEY` não estiver definida no `.env`, o backend libera sem verificar — útil para testes locais sem configurar o reCAPTCHA.

### Chaves de teste (desenvolvimento)

O Google fornece chaves de teste que sempre passam na verificação:

| | Valor |
|---|---|
| Site key (frontend) | `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` |
| Secret key (backend) | `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` |

> Em produção, gere chaves reais em: https://www.google.com/recaptcha/admin

---

## 11. Variáveis de Ambiente Necessárias

### Backend (`.env`)

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@host/db` |
| `FRONTEND_URL` | URL base do frontend (para montar links) | `https://defesacivil.pe.gov.br` |
| `PASSWORD_PREFIXO` | Prefixo concatenado **antes** do hash antes do bcrypt | `dc#srv#` |
| `PASSWORD_SUFIXO` | Sufixo concatenado **após** o hash antes do bcrypt | `#srv#dc` |
| `RECAPTCHA_SECRET_KEY` | Chave secreta reCAPTCHA v2 (backend) | `6LeIxAcT...` |

### Frontend (`.env.local`)

| Variável | Descrição | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API | `https://api.defesacivil.pe.gov.br` |
| `NEXT_PUBLIC_SENHA_PREFIXO` | Prefixo concatenado **antes** da senha no front | `dc@` |
| `NEXT_PUBLIC_SENHA_SUFIXO` | Sufixo concatenado **após** a senha no front | `@dc` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Chave pública reCAPTCHA v2 (frontend) | `6LeIxAcT...` |

> **⚠️ Produção:** Todas as variáveis de prefixo/sufixo e as chaves reCAPTCHA devem ser valores únicos por ambiente. Nunca reutilize entre dev/staging/prod.

---

## Migração do Banco de Dados

Após clonar/atualizar o projeto, execute para aplicar o novo model `ConviteRegistro`:

```bash
cd backend
npx prisma migrate dev --name add-convite-registro
```
