# Utility Billing Backend

A REST API backend for managing utility (water/electricity) meter readings and automated billing. Records meter readings, calculates bills based on usage, and delivers PDF receipts via Telegram.

## Features

- **Customer Management** — Create, read, update, delete customers with paginated listing and name search
- **Meter Reading & Billing** — Record new readings, auto-calculate usage and total cost, enforce no backward readings
- **Dynamic Pricing** — 4,000 Riel/unit for usage < 5 units; 3,000 Riel/unit for usage ≥ 5 units
- **Telegram Notifications** — Automatically send PDF receipts to one or more configured Telegram chat IDs
- **Authentication** — JWT-based login with bcrypt password hashing and role-based access (admin/staff)
- **Health Checks** — Endpoints to verify service and Telegram connectivity
- **Docker Ready** — Includes a Dockerfile for containerized deployment

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js 5 |
| Database | MongoDB (Mongoose 9) |
| Auth | JSON Web Tokens + bcryptjs |
| File Upload | Multer (memory storage) |
| Notifications | node-telegram-bot-api |
| Deployment | Docker (Alpine image) |

## Getting Started

### Prerequisites

- Node.js 18+ or Docker
- A running MongoDB instance
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))

### Installation

```bash
# Clone the repository
git clone https://github.com/Sopanha9/UtilityBilling.git
cd UtilityBilling

# Install dependencies
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default: `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `TELEGRAM_TOKEN` | Bot token from BotFather |
| `MOM_CHAT_ID` | Primary recipient Telegram chat ID |
| `ADMIN_CHAT_ID` | Admin/secondary recipient chat ID |
| `TELEGRAM_CHAT_IDS` | Comma-separated list of chat IDs (overrides the two above) |

### Running Locally

```bash
npm start
```

The API will be available at `http://localhost:5000`.

### Running with Docker

```bash
# Build the image
docker build -t utility-billing .

# Run the container
docker run -p 5000:5000 --env-file .env utility-billing
```

## API Reference

All endpoints are prefixed with `/api`.

### Authentication — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive a JWT |

**Register body:**
```json
{ "username": "admin", "password": "secret", "role": "admin" }
```

**Login body:**
```json
{ "username": "admin", "password": "secret" }
```

**Login response:**
```json
{ "success": true, "token": "<jwt>", "user": { "id": "...", "username": "admin", "role": "admin" } }
```

---

### Customers — `/api/customers`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/customers` | List all customers (paginated) |
| `GET` | `/customers/search?name=<query>` | Search customers by name |
| `POST` | `/customers` | Create a new customer |
| `PUT` | `/customers/:id` | Update a customer |
| `DELETE` | `/customers/:id` | Delete a customer |

**Pagination query params:** `page` (default: 1), `limit` (default: 10)

---

### Readings & Billing — `/api/readings`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/readings/record` | Record a meter reading and send PDF receipt via Telegram |
| `GET` | `/readings/history/:customerId` | Get full reading history for a customer |
| `GET` | `/readings/receipt/:customerId` | Get the latest reading/receipt data for a customer |

**Record reading** (`multipart/form-data`):

| Field | Type | Description |
|---|---|---|
| `customerId` | string | MongoDB ID of the customer |
| `newReading` | number | New meter reading value |
| `pdfFile` | file | Generated PDF receipt to forward via Telegram |

---

### Health — `/api/health`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Basic health check |
| `GET` | `/health/telegram` | Verify Telegram bot connectivity |

## Billing Logic

Usage below 5 units is charged at a higher per-unit rate; usage of 5 or more units receives a volume discount at a lower per-unit rate.

```
usage = newReading - previousReading

if usage < 5:
    pricePerUnit = 4,000 Riel   (standard rate)
else:
    pricePerUnit = 3,000 Riel   (volume discount rate)

totalAmount = usage × pricePerUnit
```

## Project Structure

```
UtilityBilling/
├── server.js          # Application entry point
├── Dockerfile
├── .env.example       # Environment variable template
├── config/
│   └── db.js          # MongoDB connection
├── models/
│   ├── Customer.js
│   ├── Reading.js
│   └── User.js
└── routes/
    ├── auth.js
    ├── customers.js
    ├── health.js
    └── readings.js
```

## License

ISC
