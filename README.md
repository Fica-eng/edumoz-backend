# EduMoz Backend API
### MEC Moçambique — Guia de instalação passo a passo

---

## O que é isto?

Este é o **servidor (backend)** do EduMoz. Ele liga o teu site (GitHub Pages) à base de dados real com todos os dados das escolas, alunos e professores de Moçambique.

**Arquitectura:**
```
[Dashboard GitHub Pages] ←→ [API Railway] ←→ [Base de dados Supabase]
```

---

## PASSO 1 — Criar base de dados no Supabase (gratuito)

1. Vai a **supabase.com** → clica **"Start your project"**
2. Faz login com o GitHub
3. Clica **"New project"**
   - Nome: `edumoz`
   - Password: (cria uma forte e guarda)
   - Região: escolhe a mais próxima
4. Aguarda ~2 minutos até criar
5. No menu lateral, clica em **"SQL Editor"**
6. Clica em **"New query"**
7. **Abre o ficheiro `schema.sql`** deste projecto, copia todo o conteúdo e cola no editor
8. Clica **"Run"** — as tabelas são criadas com dados de exemplo ✅

### Obter as credenciais do Supabase:
1. No menu lateral → **Project Settings → API**
2. Copia:
   - **Project URL** (ex: `https://abcdef.supabase.co`)
   - **anon public key** (chave longa)

---

## PASSO 2 — Publicar o backend no Railway (gratuito)

1. Vai a **railway.app** → **"Login with GitHub"**
2. Clica **"New Project"** → **"Deploy from GitHub repo"**
3. Selecciona este repositório (`edumoz-backend`)
4. O Railway detecta automaticamente que é Node.js

### Adicionar variáveis de ambiente no Railway:
1. No projecto Railway, clica em **"Variables"**
2. Adiciona cada variável:

| Nome | Valor |
|------|-------|
| `SUPABASE_URL` | A URL do teu projecto Supabase |
| `SUPABASE_KEY` | A anon key do Supabase |
| `FRONTEND_URL` | `https://fica-eng.github.io` |
| `NODE_ENV` | `production` |

3. Clica **"Deploy"** — aguarda ~2 minutos

### Obter o URL da tua API:
1. No Railway, clica em **"Settings"** do serviço
2. Em **"Domains"**, clica **"Generate Domain"**
3. O teu URL será algo como: `https://edumoz-backend.up.railway.app`

---

## PASSO 3 — Testar a API

Abre o browser e acede a:
```
https://SEU-PROJETO.up.railway.app/
```

Deves ver:
```json
{
  "status": "online",
  "sistema": "EduMoz API",
  "versao": "1.0.0",
  "mec": "República de Moçambique"
}
```

### Endpoints disponíveis:
```
GET /api/dashboard?ano=2025          → KPIs nacionais
GET /api/dashboard/evolucao          → Gráfico de evolução
GET /api/provincias?ano=2025         → Dados por província
GET /api/provincias/:id              → Detalhe de uma província
GET /api/escolas                     → Lista de escolas
GET /api/escolas/:id                 → Detalhe de uma escola
POST /api/escolas                    → Registar escola
GET /api/alunos?escola_id=1          → Lista de alunos
POST /api/alunos                     → Matricular aluno
GET /api/professores                 → Lista de professores
POST /api/professores                → Registar professor
```

---

## PASSO 4 — Ligar o Dashboard ao backend

No ficheiro `pages/dashboard.html` do teu site (repositório `edumoz`), adiciona no início do `<script>`:

```javascript
const API_URL = 'https://SEU-PROJETO.up.railway.app';

// Carregar KPIs reais
fetch(API_URL + '/api/dashboard?ano=2025')
  .then(r => r.json())
  .then(data => {
    document.getElementById('kpi-alunos').textContent =
      (data.kpis.total_alunos / 1000000).toFixed(1) + 'M';
    document.getElementById('kpi-aprovacao').textContent =
      data.kpis.taxa_aprovacao + '%';
    document.getElementById('kpi-evasao').textContent =
      data.kpis.taxa_evasao + '%';
    document.getElementById('kpi-escolas').textContent =
      data.kpis.total_escolas.toLocaleString('pt-PT');
  });
```

---

## Estrutura do projecto

```
edumoz-backend/
├── src/
│   ├── server.js              # Servidor principal
│   ├── config/
│   │   └── supabase.js        # Ligação à base de dados
│   └── routes/
│       ├── dashboard.js       # KPIs e estatísticas
│       ├── provincias.js      # Dados provinciais
│       ├── escolas.js         # Gestão de escolas
│       ├── alunos.js          # Gestão de alunos
│       └── professores.js     # Gestão de professores
├── schema.sql                 # Script SQL para o Supabase
├── .env.example               # Modelo das variáveis de ambiente
├── package.json
└── README.md
```

---

*EduMoz Backend v1.0 — República de Moçambique 🇲🇿*
