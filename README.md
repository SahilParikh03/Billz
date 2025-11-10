# Billz

A blockchain-based payment gateway for automated services using the X-402 protocol on Solana.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## What is Billz?

Billz is a **pay-per-use automation platform** that allows users to pay for and execute automated tasks using USDC cryptocurrency on the Solana blockchain. It implements the **X-402 payment protocol** (similar to HTTP 402 "Payment Required") to gate access to services behind verified on-chain payments.

### Why Billz?

- **No subscriptions** - Pay only for what you use
- **Instant payments** - Blockchain-powered micropayments
- **Auto refunds** - Failed jobs trigger automatic refunds
- **Trustless** - All payments verified on-chain
- **Extensible** - Easy to add new automation services

## Features

- **Blockchain Payments**: Accept USDC payments on Solana for automated services
- **X-402 Protocol**: Industry-standard payment-required HTTP protocol
- **Automated Refunds**: Failed jobs automatically trigger refunds to users
- **Job Queue System**: Background processing with retry logic
- **Wallet Integration**: Seamless Phantom wallet integration
- **Multiple Automations**: Extensible system for various paid services

## Architecture

Billz consists of three core processes:

1. **billz-web** - Next.js frontend and API server
2. **billz-queue** - Background worker for executing automation jobs
3. **billz-refund** - Automated refund processor for failed jobs

## Available Automations

| Automation | Price | Description |
|------------|-------|-------------|
| CS Skin Scraper | $2.50 | Scrape CS skin prices from 20+ websites |
| Email Automation | $0.50 | Automated email workflow |

## How It Works

1. **User Requests Service**: Client makes API call without payment
2. **402 Response**: Server responds with payment requirements
3. **Payment Submission**: Client signs and submits USDC transaction
4. **Verification**: Server verifies payment on-chain
5. **Job Queued**: Execution job added to background queue
6. **Processing**: Worker picks up job and executes with 3 retry attempts
7. **Settlement**: On success, payment is settled; on failure, refund is initiated

## Quick Start

Get started in 10 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/sahilparikh03/billz.git
cd billz

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# 4. Set up database
npm run db:generate
npm run db:push

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your Phantom wallet!

For detailed setup instructions, see [QUICKSTART.md](./QUICKSTART.md).

## Prerequisites

- **Node.js 18+**
- **MongoDB** database (MongoDB Atlas or local)
- **Solana wallet** with USDC (Phantom recommended)
- **N8N instance** (for automation workflows)
- **Git**

## Environment Variables

Create a `.env.local` file with the following:

```bash
# Network Configuration
NEXT_PUBLIC_NETWORK=solana-devnet  # or solana for mainnet
NETWORK=solana

# USDC Token Addresses
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU  # Devnet for testing

# Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
TREASURY_WALLET_ADDRESS=your_treasury_wallet_address_here

# Solana RPC
SOLANA_RPC_URL=https://api.devnet.solana.com

# Database (MongoDB)
DATABASE_URL="mongodb://localhost:27017/billz"

# N8N Configuration
N8N_BASE_URL=http://localhost:5678

# Optional: Automated refunds (⚠️ hot wallet risk)
# OPERATIONAL_WALLET_PRIVATE_KEY=your_base64_encoded_private_key
```

For a complete example, see [.env.local.example](./.env.local.example).

## Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Build the application
npm run build
```

## Running the Application

### Development Mode

```bash
# Start the web server
npm run dev
```

### Production Mode with PM2

```bash
# Start all three processes
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Stop all processes
pm2 stop all
```

### Manual Process Management

```bash
# Terminal 1: Web server
npm start

# Terminal 2: Job queue worker
node --loader ts-node/esm ./lib/job-queue.ts

# Terminal 3: Refund processor
node --loader ts-node/esm ./lib/refund-processor.ts
```

## Project Structure

```
billz/
├── app/
│   ├── api/
│   │   ├── execute-automation/   # Main payment & execution endpoint
│   │   ├── job/[jobId]/status/   # Job status polling endpoint
│   │   └── health/               # Health check for monitoring
│   ├── layout.tsx                # Root layout with wallet provider
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/
│   ├── WalletProvider.tsx        # Solana wallet setup
│   └── ExecuteAutomationButton.tsx  # Smart execution button
├── lib/
│   ├── x402-handler.ts           # Server-side payment handler
│   ├── x402-client.ts            # Client-side payment client
│   ├── job-queue.ts              # Background job processor
│   ├── refund-processor.ts       # Automated refund system
│   ├── n8n-client.ts             # N8N workflow integration
│   └── database.ts               # Prisma client
├── prisma/
│   └── schema.prisma             # MongoDB schema
├── README.md                     # This file
├── QUICKSTART.md                 # Quick setup guide
├── DEPLOYMENT.md                 # Production deployment guide
└── .env.local.example            # Example environment variables
```

## Database Schema

The system uses Prisma with MongoDB:

- **Payment**: Stores payment records with verification data and refund tracking
- **Execution**: Tracks job status (pending → running → completed/failed)

View the full schema in [prisma/schema.prisma](./prisma/schema.prisma).

## Adding New Automations

Edit `lib/x402-handler.ts` and add to the `AUTOMATION_PRICING` object:

```typescript
export const AUTOMATION_PRICING = {
  'your-automation-id': {
    name: 'Your Automation Name',
    priceUSDC: 1.00,
    priceAtomicUnits: '1000000', // Price in micro-units (6 decimals)
    description: 'What your automation does',
  },
  // ... existing automations
} as const;
```

## Security Considerations

### Treasury Wallet
- The treasury wallet receives all payments
- Use a secure wallet (hardware wallet recommended for mainnet)
- Only the public address is needed for receiving payments

### Operational Wallet (Refunds)
- **High Risk**: Requires private key stored on server
- Used for automated refunds
- Consider manual refunds for mainnet to avoid hot wallet risk
- If using automated refunds, encrypt private key and use dedicated operational wallet

### Best Practices
- Start on devnet for testing
- Use environment variables for all sensitive data
- Never commit private keys to version control
- Set reasonable `maxPaymentAmount` limits in client
- Monitor refund queue for suspicious activity

## API Endpoints

### POST `/api/execute-automation`
Execute a paid automation

**Request:**
```json
{
  "automationId": "cs-skin-scraper",
  "params": {}
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "jobId": "job_123",
  "status": "pending",
  "statusUrl": "/api/job/job_123/status"
}
```

### GET `/api/job/{jobId}/status`
Check job execution status

**Response:**
```json
{
  "status": "completed",
  "result": { /* automation results */ }
}
```

## Troubleshooting

### "Payment verification failed"
- Ensure treasury wallet address is correct
- Check network matches (devnet vs mainnet)
- Verify USDC mint address is correct for network

### "Job stuck in pending"
- Ensure job queue worker is running
- Check worker logs for errors
- Verify N8N integration is configured

### "Refund not processing"
- Check refund processor is running
- Verify operational wallet has sufficient SOL for gas
- Check operational wallet has USDC balance for refunds

## Technology Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Blockchain**: Solana Web3.js, SPL Token
- **Wallet**: Solana Wallet Adapter (Phantom)
- **Payment Protocol**: X-402 (x402-solana)
- **Database**: MongoDB with Prisma ORM
- **Automation**: N8N workflows
- **Process Management**: PM2
- **Language**: TypeScript

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get running locally in 10 minutes
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[.env.local.example](./.env.local.example)** - Example environment configuration

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Support for multiple cryptocurrencies (SOL, other SPL tokens)
- [ ] Dashboard for tracking automation history
- [ ] Webhook notifications for job completion
- [ ] API key authentication for programmatic access
- [ ] Multi-wallet support (Solflare, Backpack, etc.)
- [ ] Analytics and usage metrics

## Security

- Treasury wallet uses public address only (no private key on server)
- Payment verification happens on-chain
- All environment variables should be kept secure
- Consider manual refunds for production (avoid hot wallet risk)

For security issues, please email security@yourdomain.com (do not open public issues).

## License

[Add your license here - MIT recommended]

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/billz/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/billz/discussions)
- **Twitter**: [@yourusername](https://twitter.com/yourusername)

## Acknowledgments

Built with:
- [Solana](https://solana.com) - High-performance blockchain
- [N8N](https://n8n.io) - Workflow automation
- [Next.js](https://nextjs.org) - React framework
- [Prisma](https://prisma.io) - Database ORM

---

**Made with ❤️ for the Solana ecosystem**
