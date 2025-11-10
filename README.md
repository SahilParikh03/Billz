# Billz

A blockchain-based payment gateway for automated services using the X-402 protocol on Solana.

## What is Billz?

Billz is a pay-per-use automation platform that allows users to pay for and execute automated tasks using USDC cryptocurrency on the Solana blockchain. It implements the X-402 payment protocol (similar to HTTP 402 "Payment Required") to gate access to services behind verified on-chain payments.

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

## Prerequisites

- Node.js 18+
- Solana wallet with USDC
- PostgreSQL database (for Prisma)
- N8N instance (for automation workflows)

## Environment Variables

Create a `.env.local` file with the following:

```bash
# Network Configuration
NEXT_PUBLIC_NETWORK=solana-devnet  # or solana-mainnet
NETWORK=solana

# USDC Token Addresses
NEXT_PUBLIC_USDC_DEVNET=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
NEXT_PUBLIC_USDC_MAINNET=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU  # Use devnet for testing

# Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
TREASURY_WALLET_ADDRESS=your_treasury_wallet_address_here

# Solana RPC
SOLANA_RPC_URL=https://api.devnet.solana.com  # or mainnet-beta

# Refund Configuration (Optional - for automated refunds)
OPERATIONAL_WALLET_PRIVATE_KEY=your_base64_encoded_private_key
```

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

## Database Schema

The system uses Prisma with the following main models:

- **Payment**: Stores payment records with verification data
- **Execution**: Tracks job status (pending → running → completed/failed)

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

- **Frontend**: Next.js, React, TailwindCSS
- **Blockchain**: Solana Web3.js, SPL Token
- **Wallet**: Solana Wallet Adapter (Phantom)
- **Payment Protocol**: x402-solana
- **Database**: Prisma ORM
- **Automation**: N8N workflows
- **Process Management**: PM2

## License

[Add your license here]

## Support

For issues and questions, please open an issue in the repository.
