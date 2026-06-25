# 🛡️ Sistema de Treinamento para Formulários da Defesa Civil

Sistema web desenvolvido com o objetivo de apoiar o treinamento e capacitação de usuários no preenchimento de formulários utilizados pela Defesa Civil.

A plataforma oferece um ambiente controlado para prática, validação e simulação de formulários, permitindo que usuários aprendam o processo de preenchimento sem impactar sistemas oficiais ou gerar registros reais.

## 📋 Funcionalidades

### 🔐 Autenticação e Controle de Acesso

-   Registro de usuários
    
-   Login e logout
    
-   Controle de permissões
    
-   Gerenciamento de sessões
    
-   Recuperação de acesso
    

### 👥 Gestão de Usuários

-   Visualização de usuários
    
-   Edição de informações cadastrais
    
-   Controle de permissões
    
-   Ativação e desativação de contas
    

### 📢 Comunicados

-   Publicação de comunicados
    
-   Edição e atualização de conteúdo
    
-   Visualização pelos usuários
    

### 📝 Simulador de Formulários

-   Simulação de formulários da Defesa Civil
    
-   Validação de dados preenchidos
    
-   Registro de tentativas
    
-   Repetição de treinamentos
    
-   Histórico de submissões

## 🏗️ Arquitetura do Projeto

O sistema foi desenvolvido seguindo uma arquitetura web fullstack, composta por frontend, backend e banco de dados relacional.

```text
Frontend (Next.js)
        │
        ▼
Backend (Node.js + Express)
        │
        ▼
Banco de Dados (PostgreSQL)

```

## 🚀 Tecnologias Utilizadas

### Frontend

-   Next.js
    
-   React 19
    
-   TypeScript
    
-   TailwindCSS
    
-   Google reCAPTCHA
    

### Backend

-   Node.js
    
-   Express
    
-   TypeScript
    
-   Prisma ORM
    
-   bcrypt
    

### Banco de Dados

-   PostgreSQL
    
-   Docker
    

### Testes

-   Vitest
    
## 📦 Pré-requisitos

Antes de executar o projeto, certifique-se de possuir:

-   Node.js instalado
    
-   Docker instalado
    
-   Git instalado
    
## ⚙️ Instalação e Execução

### 1. Clonar o repositório

```bash
git clone https://github.com/Pedro-hashm/Defesa-Civil.git
cd Defesa-Civil

```

### 2. Subir o banco de dados

```bash
docker-compose up -d

```

### 3. Configurar o backend

```bash
cd backend
npm install

```

Criar um arquivo `.env` com base no `.env.example`:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/defesa_civil"

```

### 4. Executar as migrations

```bash
npx prisma migrate dev

```

### 5. Popular o banco (opcional)

```bash
npx prisma db seed

```

### 6. Executar o backend

```bash
npm run dev

```

### 7. Executar o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev

```

## 🧪 Executando os Testes

No diretório do backend:

```bash
npm test

```

Ou para modo observação:

```bash
npm run test:watch

```

## 🌐 Endereços da Aplicação

Serviço

Endereço

Frontend

[http://localhost:3000](http://localhost:3000/)

Backend

[http://localhost:3001](http://localhost:3001/)

## 📁 Estrutura do Projeto

```text
Defesa-Civil/
├── frontend/
│   ├── app/
│   ├── components/
│   └── public/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   └── tests/
│
├── docker-compose.yml
└── README.md

```

## 📚 Documentação

Durante o desenvolvimento foram produzidos os seguintes artefatos:

-   Documento de Requisitos
    
-   Diagrama Entidade-Relacionamento (DER)
    
-   Modelo Lógico
    
-   Dicionário de Dados
    
-   Plano de Testes
    
-   Documentação de Fluxo de Envio de Formulários
    
-   Relatório Técnico
    
-   Documento de Transferência de Tecnologia
    
## ⚠️ Observações

-   O sistema possui finalidade exclusivamente educacional e de treinamento.
    
-   Nenhuma informação enviada possui validade oficial junto à Defesa Civil.
    
-   Os dados persistidos são utilizados apenas para fins de simulação e aprendizagem.
    
## 👨‍💻 Equipe

Projeto desenvolvido como atividade acadêmica no curso de Análise e Desenvolvimento de Sistemas, envolvendo atividades de levantamento de requisitos, modelagem, implementação, testes e documentação técnica.
