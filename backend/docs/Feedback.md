# Sistema de Avaliação e Correção de Simulações

## Feedback do Supervisor

---

# Visão Geral

O sistema de avaliação permite um ciclo completo de revisão (**feedback loop**) entre:

* **Alunos** → preenchem os formulários **FIDE** e **DMATE**
* **Supervisores** → avaliam as simulações enviadas

O supervisor pode:

* **Aprovar** a tentativa
* **Apontar erros específicos**

Caso existam erros:

1. O aluno recebe o feedback
2. Corrige o documento preenchido anteriormente
3. Reenvia para uma nova avaliação

---

# Stack Utilizada

| Camada                          | Tecnologia                                       |
| ------------------------------- | ------------------------------------------------ |
| Frontend (Telas)                | Next.js (App Router), React, Tailwind CSS        |
| Lógica de Estado                | React Hooks (`useState`, `useEffect`, `useMemo`) |
| Backend (API)                   | Express.js + TypeScript                          |
| Persistência e ORM              | PostgreSQL + Prisma                              |
| Estados da Tentativa            | `enum StatusTentativa`                           |
| Estrutura flexível de respostas | `jsonb`                                          |

---

# Máquina de Estados (Fluxo da Tentativa)

A coluna `status` da tabela `TentativaFormulario` controla todo o ciclo da simulação.

```text
[ ALUNO ]
Preenche FIDE/DMATE
(POST /tentativas)
        ↓

Status: INICIADO
(Aguardando avaliação)
        ↓

[ SUPERVISOR ]
Analisa na tela de Respostas
        ├── Aprovar
        │       ↓
        │   Status: FINALIZADO
        │   (gera finalizado_em)
        │
        └── Reprovar
                ↓
            Status: ERRO
            (grava feedback no campo erros)
                ↓

[ ALUNO ]
Visualiza feedback em "Minhas Respostas"
        ↓

Clica em "Corrigir Erros"
(Formulário aberto com ?edit=ID)
        ↓

Edita e reenviа
(PUT /tentativas/:id)
        ↓

Status: INICIADO
(erros é limpo para nova avaliação)
```

---

# Componentes do Frontend

---

## 1. Painel do Supervisor (`RespostasPage.tsx`)

### Funcionalidades

### Visualização Flexível

O sistema consegue interpretar:

* Estruturas antigas
* Estruturas novas agrupadas

Utilizando a função adaptadora:

```ts
parseRespostas()
```

Compatibilidade:

```json
{
  "fide": { ... },
  "dmate": { ... }
}
```

e também formatos legados com campos na raiz do JSON.

---

### Painel de Avaliação

Substitui a visualização bruta do JSON.

Possui ações:

* Aprovar
* Apontar erros

---

### Atualização em Tempo Real

O feedback dispara um:

```http
PUT /tentativas/:id
```

Atualizando imediatamente o estado local da aplicação, sem necessidade de refresh.

---

## 2. Painel do Aluno (`MinhasRespostasPage.tsx`)

Lista todas as simulações vinculadas ao token do aluno.

---

### Renderização Condicional

#### Status: `ERRO`

Exibe:

* Caixa vermelha de alerta
* Texto do feedback do supervisor
* Botão **"Corrigir Erros"**

---

#### Status: `FINALIZADO`

Exibe:

* Botão para geração do PDF oficial

---

#### Status: `INICIADO`

Exibe:

* Mensagem indicando que a tentativa está em análise

---

## 3. Simulador Adaptativo (`FideDmatePage.tsx`)

---

### Modo Criação vs Edição

Se a URL contiver:

```text
?edit={id}
```

A página entra em modo de correção:

1. Faz um `GET`
2. Recupera a tentativa anterior
3. Popula os componentes:

```tsx
<Fide />
<Dmate />
```

---

### Deep Parsing

Utiliza:

```ts
deepParseJSON()
```

Para converter corretamente os dados vindos do PostgreSQL (`jsonb`) em objetos JavaScript reais.

Isso evita problemas de dupla serialização causados pelo Prisma.

---

### Flattening (Achatamento)

Utiliza:

```ts
adaptarParaFidePlano()
```

Para transformar objetos profundamente aninhados em um estado plano compatível com os formulários React.

---

# Backend e Persistência

## Arquivos Principais

* `formulario.controller.ts`
* `formulario.service.ts`

---

# Estrutura do Payload (Correção pelo Aluno)

Quando o aluno reenviа um formulário corrigido:

```json
{
  "status": "INICIADO",
  "erros": null,
  "respostas": {
    "fide": { },
    "dmate": { }
  }
}
```

---

# Regras de Negócio (`atualizarTentativa`)

---

## Fallback de Status

Caso nenhum status seja enviado na criação:

```ts
INICIADO
```

é utilizado como padrão.

---

## Registro de Tempo

### Quando aprovado

Se o status mudar para:

```ts
FINALIZADO
```

O sistema grava:

```ts
finalizado_em = new Date()
```

---

### Quando reenviado

Se o status voltar para:

```ts
INICIADO
```

O sistema limpa:

```ts
finalizado_em = null
```

---

## Tratamento do Campo `erros`

O campo aceita:

* Texto simples do supervisor
* `null` quando limpo pelo aluno

Para limpar corretamente o `jsonb`:

```ts
Prisma.JsonNull
```

---

## Segurança e Autorização

O método:

```ts
podeGerenciarTentativa()
```

Valida se quem está atualizando é:

* Um `ADMIN`
* Ou o próprio dono da tentativa

```ts
usuarioId === donoId
```

---

# Evoluções Futuras

---

## 1. Notificações por Email

Enviar email automático ao aluno quando:

* Receber feedback
* Receber aprovação

Sugestões:

* AWS SES
* SendGrid

---

## 2. Histórico de Feedbacks

Atualmente:

```text
erros
```

é sobrescrito a cada reenvio.

---

### Sugestão

Criar tabela:

```text
FeedbackTentativa
```

Relacionamento:

```text
TentativaFormulario (1:N) FeedbackTentativa
```

Permitindo armazenar:

* Histórico completo
* Comentários anteriores
* Data/hora das revisões
* Supervisor responsável

---

## 3. Comentários Inline

Permitir comentários diretamente em campos específicos do:

* FIDE
* DMATE

Ao invés de apenas um campo geral de feedback.

Exemplo:

```json
{
  "campo": "endereco",
  "comentario": "CEP inválido"
}
```

---

# Resultado

O sistema implementa um fluxo completo de:

* Submissão
* Revisão
* Feedback
* Correção
* Reenvio
* Aprovação

Mantendo:

* Controle de estado
* Persistência estruturada
* Segurança de acesso
* Compatibilidade entre versões de payload
* Escalabilidade para futuras melhorias
