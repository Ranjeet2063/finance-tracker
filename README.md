# AI-Powered Personal Finance Tracker

A full-stack, production-grade personal finance management application with AI-powered insights, predictions, and financial advisory.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
├─────────────────────────────────────────────────────────┤
│                    Next.js + Tailwind                    │
├─────────────────────────────────────────────────────────┤
│                     Nginx (Reverse Proxy)                │
├──────────────────────┬──────────────────────────────────┤
│    Frontend :3000    │       Backend :5000               │
│   (Next.js/React)    │    (Express.js/MongoDB)           │
├──────────────────────┼──────────────────────────────────┤
│                      │    AI Service :5001              │
│                      │    (Python/Flask + ML)            │
├──────────────────────┴──────────────────────────────────┤
│                    MongoDB (Database)                    │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB with Mongoose ODM |
| AI/ML | Python, Flask, scikit-learn, Pandas |
| Auth | JWT, bcrypt, Google OAuth |
| Security | Helmet, CORS, Rate Limiting, Input Validation |
| Real-time | WebSockets (Socket.IO) |
| Testing | Jest (Backend), pytest (AI), Supertest |
| Deploy | Docker, Docker Compose, Nginx |

## Folder Structure

```
finance-tracker/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── config/            # DB config, constants
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, validation, upload
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Email, export, scheduler
│   │   └── app.js             # Express entry point
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── context/           # Auth, Theme context
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Pages (login, dashboard)
│   │   ├── services/          # API client
│   │   ├── styles/            # Tailwind globals
│   │   └── types/             # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── ai/                         # Python AI microservice
│   ├── app.py                 # Flask endpoints
│   ├── requirements.txt
│   ├── Dockerfile
│   └── tests/
├── docker-compose.yml          # Multi-service orchestration
├── nginx.conf                  # Reverse proxy config
└── .env.example
```

## Database Schema

### Users
| Field | Type | Description |
|-------|------|-------------|
| name | String | Full name |
| email | String | Unique email (lowercase) |
| password | String | bcrypt hashed (select: false) |
| googleId | String | Google OAuth ID |
| currency | String | Default currency (USD, EUR, INR...) |
| preferences | Object | Dark mode, notifications |
| emailVerified | Boolean | Email verification flag |

### Transactions (Income & Expenses)
| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId | Reference to User |
| type | Enum | 'income' or 'expense' |
| amount | Number | Transaction amount (>=0) |
| category | String | Expense or Income category |
| description | String | Optional description |
| date | Date | Transaction date |
| currency | String | Transaction currency |
| tags | [String] | Custom tags |
| receipt | Object | Uploaded receipt URL |
| isRecurring | Boolean | Recurring transaction flag |
| source | Enum | manual, voice, ocr, import |

### Budgets
| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId | Reference to User |
| category | String | Budget category |
| amount | Number | Budget limit |
| period | Enum | weekly, monthly, yearly |
| alertsEnabled | Boolean | Overspend alerts |
| alertThreshold | Number | % threshold for alerts |

### Notifications
| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId | Reference to User |
| type | Enum | Alert types |
| title | String | Notification title |
| message | String | Notification body |
| severity | Enum | info, warning, danger, success |
| read | Boolean | Read status |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/google | Google OAuth |
| GET | /api/auth/profile | Get user profile |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/change-password | Change password |
| POST | /api/auth/forgot-password | Send reset email |
| POST | /api/auth/reset-password/:token | Reset password |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/expenses | List expenses (paginated, filterable) |
| GET | /api/expenses/:id | Get single expense |
| POST | /api/expenses | Create expense |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |
| POST | /api/expenses/scan-receipt | OCR receipt scanning |

### Income
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/income | List income records |
| POST | /api/income | Add income |
| PUT | /api/income/:id | Update income |
| DELETE | /api/income/:id | Delete income |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/budget | Get budgets with spending |
| POST | /api/budget | Create budget |
| PUT | /api/budget/:id | Update budget |
| DELETE | /api/budget/:id | Delete budget |
| GET | /api/budget/report | Budget performance report |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/dashboard | Dashboard stats |
| GET | /api/reports/monthly | Monthly report |
| GET | /api/reports/yearly | Yearly report |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/predict | Expense predictions |
| GET | /api/ai/saving-advice | Saving recommendations |
| GET | /api/ai/financial-health | Health score |
| POST | /api/ai/chat | AI chatbot |
| POST | /api/ai/voice-expense | Voice expense entry |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | List notifications |
| PATCH | /api/notifications/:id/read | Mark as read |
| POST | /api/notifications/read-all | Mark all as read |
| DELETE | /api/notifications/:id | Delete notification |

## Features

### 1. User Authentication
- Email/password registration with JWT
- Google OAuth integration
- Password hashing (bcrypt, 12 rounds)
- Password reset via email
- Rate-limited auth endpoints

### 2. Financial Dashboard
- Real-time income vs expense tracking
- Interactive pie charts (Chart.js)
- Monthly trend lines
- Financial health score (0-100)

### 3. AI-Powered Features
- **Expense Prediction:** Random Forest model predicts 7 and 30 day expenses
- **Saving Advisor:** Analyzes spending patterns, generates personalized tips
- **Financial Health Score:** Multi-factor scoring (savings rate, spending behavior, budget discipline, consistency)
- **AI Chatbot:** NLP-based financial assistant with intent recognition

### 4. Smart Budgeting
- Category-wise budget limits
- Real-time spending tracking
- Overspend alerts (WebSocket + DB)
- Budget rollover support

### 5. Reports & Export
- Monthly/yearly breakdowns
- Bar chart visualizations
- PDF and Excel export
- Category-wise analysis

### 6. OCR Receipt Scanning
- Tesseract.js integration
- Auto-extracts amount and store name

### 7. Voice Expense Entry
- NLP-based voice command parsing
- Natural language support: "Spent 25 dollars on food"

## Running Locally

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB 7+ (or Docker)
- npm or yarn

### Backend
```bash
cd backend
cp .env.example .env  # Edit with your values
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### AI Service
```bash
cd ai
pip install -r requirements.txt
python app.py
```

## Docker Deployment

```bash
# Clone and configure
git clone <repo>
cd finance-tracker
cp .env.example .env

# Start all services
docker-compose up -d --build

# Verify
curl http://localhost:5000/api/health
curl http://localhost:5001/health
```

## Cloud Deployment Guide

### VPS (DigitalOcean, AWS EC2, Linode)
```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Clone project
git clone https://github.com/yourusername/finance-tracker.git
cd finance-tracker

# 4. Configure SSL (Let's Encrypt)
docker run -it --rm -p 80:80 -p 443:443 \
  -v $PWD/ssl:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d yourdomain.com

# 5. Start
docker-compose up -d --build
```

### Kubernetes (GKE, EKS, AKS)
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/
```

## Testing Strategy

| Layer | Tool | Focus |
|-------|------|-------|
| Backend Unit | Jest | Controllers, models, middleware |
| Backend Integration | Supertest | API endpoints, auth flow |
| AI Unit | pytest | Predictions, chat, data prep |
| E2E | Cypress | User flows, edge cases |
| Load | k6 | API performance, rate limiting |

## Security

- **JWT Authentication** with Bearer token scheme
- **Password Hashing** (bcrypt, 12 salt rounds)
- **Rate Limiting** on auth and API endpoints
- **Helmet.js** security headers
- **CORS** configured for frontend origin only
- **Input Validation** with express-validator
- **XSS Protection** via Content-Security-Policy
- **File Upload** validation (type, size limits)
- **MongoDB Injection** protection via Mongoose

## Scaling

- **Horizontal:** Stateless backend behind Nginx load balancer
- **Caching:** In-memory caching (Map) for API responses
- **Database:** MongoDB indexes on user, date, type
- **Real-time:** Socket.IO for live updates
- **AI:** Separate microservice for ML workloads
- **CDN:** Static assets served via Nginx with cache headers

## Performance

- Next.js static generation for landing pages
- React lazy loading for dashboard components
- MongoDB compound indexes for query performance
- Response compression via Nginx
- API pagination (default 20 items)
- Debounced search inputs
- Optimistic UI updates
