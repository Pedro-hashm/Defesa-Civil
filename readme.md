# Defesa Civil - Sistema de Treinamento

Projeto desenvolvido para simulação e treinamento no preenchimento de formulários da Defesa Civil.

---

## 🚀 Tecnologias

* Frontend: Next.js + React + TypeScript + TailwindCSS
* Backend: Node.js + Prisma
* Banco de Dados: PostgreSQL (Docker)

---

## 📦 Pré-requisitos

* Node.js instalado
* Docker instalado

---

## ⚙️ Como rodar o projeto

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd defesa-civil
```

---

### 2. Subir o banco de dados

```bash
docker-compose up -d
```

---

### 3. Configurar o backend

```bash
cd backend
npm install
```

Criar um arquivo `.env` baseado no `.env.example`:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/defesa_civil"
```

---

### 4. Rodar migrations do Prisma

```bash
npx prisma migrate dev
```

### 📌 O que são migrations?

Migrations são arquivos que descrevem alterações na estrutura do banco de dados (como criação de tabelas, colunas, etc).

Quando você roda o comando acima, o Prisma:

* Cria ou atualiza as tabelas no banco automaticamente
* Gera arquivos de histórico dessas mudanças
* Permite que outros desenvolvedores recriem o mesmo banco ao rodar o projeto

Ou seja, **em vez de compartilhar o banco em si, o time compartilha as migrations**.

---

### 5. Rodar o backend

```bash
npm run dev
```

---

### 6. Rodar o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Acessos

* Frontend: http://localhost:3000
* Backend: http://localhost:3001 (ou porta configurada)

---

## 📁 Estrutura do projeto

```
defesa-civil/
├── frontend/
├── backend/
├── docker-compose.yml
```

---

## 📌 Observações

* O banco de dados roda via Docker
* Os dados não são versionados no Git
* O banco é recriado a partir das migrations

---
