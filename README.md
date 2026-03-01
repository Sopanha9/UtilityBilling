# UtilityBilling — Backend API

A Node.js/Express REST API for managing utility (electricity) billing. It handles customer records, meter readings, automatic bill calculation, PDF receipt delivery via Telegram, and JWT-based user authentication.

---

## Features

- **Customer Management** – Create, read, update, delete, and search customers.
- **Meter Readings & Billing** – Record new meter readings, auto-calculate usage and total cost, and persist billing history.
- **PDF Receipt via Telegram** – Upload a generated PDF receipt and have it forwarded automatically to one or more Telegram chats.
- **Authentication** – Register and log in users (admin / staff roles) with bcrypt-hashed passwords and JWT tokens.
- **Health Check** – Simple endpoint to verify the service is running, with an optional Telegram ping test.
- **Docker Support** – Production-ready `Dockerfile` using a non-root user for security.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| Database | MongoDB (via Mongoose) |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| File Upload | Multer |
| Notifications | Telegram Bot API (`node-telegram-bot-api`) |
| Config | dotenv |
| Container | Docker (Alpine-based) |

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A running MongoDB instance (local or Atlas)
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Sopanha9/UtilityBilling.git
cd UtilityBilling

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and fill in the required values (see below)

# 4. Start the server
npm start
```

The server listens on `http://localhost:5000` by default.

---

## Environment Variables

Copy `.env.example` to `.env` and set the following values:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | *(required)* |
| `JWT_SECRET` | Secret key used to sign JWT tokens | *(required)* |
| `TELEGRAM_TOKEN` | Bot token from BotFather | *(required)* |
| `MOM_CHAT_ID` | A Telegram chat ID to receive receipts | `1286269182` |
| `ADMIN_CHAT_ID` | Admin Telegram chat ID (receives error notifications too) | *(optional)* |
| `TELEGRAM_CHAT_IDS` | Comma-separated list of chat IDs — overrides the two above | *(optional)* |

**Example `.env`:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/utility_billing
JWT_SECRET=supersecretkey
TELEGRAM_TOKEN=123456789:AAF...
TELEGRAM_CHAT_IDS=1286269182,987654321
```

---

## API Endpoints

### Authentication — `/api/auth`

| Method | Path | Description | Body |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | `{ username, password, role? }` |
| `POST` | `/api/auth/login` | Log in and receive a JWT | `{ username, password }` |

`role` can be `"admin"` or `"staff"` (defaults to `"staff"`).

---

### Customers — `/api/customers`

| Method | Path | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/customers` | List all customers (paginated) | `?page=1&limit=10` |
| `GET` | `/api/customers/search` | Search customers by name | `?name=<term>` |
| `POST` | `/api/customers` | Create a new customer | `{ name, address?, last_reading? }` |
| `PUT` | `/api/customers/:id` | Update a customer | `{ name?, address?, last_reading? }` |
| `DELETE` | `/api/customers/:id` | Delete a customer | — |

---

### Readings & Billing — `/api/readings`

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/readings/record` | Record a new meter reading, calculate the bill, and send the PDF to Telegram |
| `GET` | `/api/readings/history/:customerId` | Retrieve full reading history for a customer |
| `GET` | `/api/readings/receipt/:customerId` | Retrieve the latest receipt for a customer |

#### `POST /api/readings/record`

Accepts `multipart/form-data`:

| Field | Type | Description |
|---|---|---|
| `customerId` | string | MongoDB ObjectId of the customer |
| `newReading` | number | Current meter reading |
| `pdfFile` | file | Pre-generated PDF receipt to forward via Telegram |

**Billing logic:**
- Usage = `newReading − lastReading`
- Price per unit: **4,000 ៛** if usage < 5 units, **3,000 ៛** if usage ≥ 5 units  
  *(Low-usage customers are billed at the higher rate; bulk usage qualifies for the lower rate.)*
- Total = `usage × pricePerUnit`

---

### Health Check — `/api/health`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{ ok: true, timestamp }` |
| `GET` | `/api/health/telegram` | Sends a test message to all configured Telegram chats |

---

## Docker

### Build and run

```bash
# Build the image
docker build -t utility-billing .

# Run the container (pass env vars or mount an .env file)
docker run -p 5000:5000 --env-file .env utility-billing
```

The image is based on `node:20-alpine` and runs as a non-root `node` user for improved security.

---

## Project Structure

```
UtilityBilling/
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── Customer.js        # Customer schema
│   ├── Reading.js         # Reading/billing record schema
│   └── User.js            # User schema (auth)
├── routes/
│   ├── auth.js            # /api/auth
│   ├── customers.js       # /api/customers
│   ├── readings.js        # /api/readings
│   └── health.js          # /api/health
├── .env.example           # Environment variable template
├── Dockerfile             # Production Docker image
├── server.js              # Application entry point
└── package.json
```

---

## License

ISC
