# Billz Deployment Guide

This guide covers deploying Billz to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup (MongoDB)](#database-setup-mongodb)
4. [N8N Setup](#n8n-setup)
5. [Deployment Options](#deployment-options)
6. [Security Checklist](#security-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

Before deploying, ensure you have:

- **Node.js 18+** installed
- **MongoDB** database (MongoDB Atlas or self-hosted)
- **N8N** instance running (self-hosted or cloud)
- **Solana Treasury Wallet** (mainnet or devnet)
- **Domain name** (optional but recommended)
- **SSL Certificate** (Let's Encrypt recommended)
- **PM2** for process management (or Docker)

---

## Environment Setup

### 1. Production Environment Variables

Create a `.env.local` file in production (or use environment variables):

```bash
# ========================================
# NETWORK CONFIGURATION
# ========================================
NEXT_PUBLIC_NETWORK=solana  # Use 'solana' for mainnet, 'solana-devnet' for testnet
NETWORK=solana

# ========================================
# SOLANA RPC
# ========================================
# Use a reliable RPC provider for production
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Recommended: Use paid RPC services for better reliability
# - Helius: https://helius.xyz
# - QuickNode: https://quicknode.com
# - Alchemy: https://alchemy.com

# Public RPC (exposed to frontend)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# ========================================
# USDC TOKEN ADDRESSES
# ========================================
# Mainnet USDC
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NEXT_PUBLIC_USDC_MAINNET=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Devnet USDC (for testing)
NEXT_PUBLIC_USDC_DEVNET=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# ========================================
# TREASURY WALLET
# ========================================
# Your Solana wallet address (public key) that receives payments
TREASURY_WALLET_ADDRESS=YOUR_MAINNET_WALLET_ADDRESS_HERE

# ========================================
# BACKEND API
# ========================================
NEXT_PUBLIC_API_URL=https://yourdomain.com

# ========================================
# DATABASE (MongoDB)
# ========================================
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/billz?retryWrites=true&w=majority"

# ========================================
# N8N CONFIGURATION
# ========================================
N8N_BASE_URL=https://n8n.yourdomain.com
N8N_API_KEY=your_n8n_api_key_here

# ========================================
# REFUND CONFIGURATION (OPTIONAL)
# ========================================
# WARNING: Only use if you want AUTOMATED refunds
# Requires operational wallet private key (hot wallet risk!)
# For maximum security, do manual refunds instead
# OPERATIONAL_WALLET_PRIVATE_KEY=your_base64_encoded_private_key
```

### 2. Security Best Practices

**NEVER commit `.env.local` to version control!**

For production secrets management, consider:
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Cloud Secret Manager**

---

## Database Setup (MongoDB)

### Option 1: MongoDB Atlas (Recommended for Quick Setup)

1. **Create MongoDB Atlas Account**: https://www.mongodb.com/cloud/atlas
2. **Create a Cluster** (Free tier available)
3. **Configure Network Access**: Add your server's IP address
4. **Create Database User**: With read/write permissions
5. **Get Connection String**: From "Connect" button
6. **Update `.env.local`**: Add connection string to `DATABASE_URL`

### Option 2: Self-Hosted MongoDB

```bash
# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
> use billz
> db.createUser({
    user: "billzapp",
    pwd: "your_secure_password",
    roles: [{ role: "readWrite", db: "billz" }]
  })
```

Connection string:
```
DATABASE_URL="mongodb://billzapp:your_secure_password@localhost:27017/billz"
```

### 3. Initialize Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Push schema to MongoDB
npm run db:push
```

---

## N8N Setup

N8N is used to execute the actual automation workflows.

### Option 1: Self-Hosted N8N

```bash
# Install N8N globally
npm install n8n -g

# Start N8N
n8n start

# Or use Docker
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your_password \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Option 2: N8N Cloud

Sign up at https://n8n.io/cloud

### Create Automation Workflows

For each automation in `lib/x402-handler.ts`:

1. **Create a new workflow** in N8N
2. **Add a Webhook trigger node**:
   - Method: POST
   - Path: `/webhook/cs-skin-scraper` (or your automation ID)
   - Response Mode: "When Last Node Finishes"
3. **Build your automation logic**
4. **Add a Respond to Webhook node** at the end:
   ```json
   {
     "success": true,
     "data": {
       // Your automation results
     }
   }
   ```
5. **Activate the workflow**

### Generate N8N API Key

1. Go to N8N Settings → API
2. Create new API key
3. Add to `.env.local` as `N8N_API_KEY`

---

## Deployment Options

### Option 1: VPS Deployment (Ubuntu)

Recommended for full control and cost-effectiveness.

#### 1. Server Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Install Certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx
```

#### 2. Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/billz.git
cd billz

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 3. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/billz
```

Add configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and get SSL:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/billz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 4. Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

### Option 2: Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.local
    depends_on:
      - mongodb
    restart: unless-stopped

  queue:
    build: .
    command: node --loader ts-node/esm ./lib/job-queue.ts
    env_file:
      - .env.local
    depends_on:
      - mongodb
    restart: unless-stopped

  refund:
    build: .
    command: node --loader ts-node/esm ./lib/refund-processor.ts
    env_file:
      - .env.local
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=your_password
    restart: unless-stopped

volumes:
  mongodb_data:
```

Deploy:

```bash
docker-compose up -d
```

### Option 3: Cloud Platform Deployment

#### Vercel (Web App Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Note**: Queue and refund workers must be deployed separately (VPS or serverless functions).

#### Railway

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

---

## Security Checklist

### Before Going Live

- [ ] **Environment Variables**: All sensitive data in `.env.local`, not committed to git
- [ ] **Treasury Wallet**: Using secure hardware wallet for mainnet
- [ ] **RPC Endpoint**: Using reliable paid RPC service (not public endpoints)
- [ ] **Database**: MongoDB authentication enabled
- [ ] **Database Backup**: Automated daily backups configured
- [ ] **SSL Certificate**: HTTPS enabled with valid certificate
- [ ] **Firewall**: Configured to only allow necessary ports
- [ ] **N8N Security**: Basic auth or API key authentication enabled
- [ ] **Rate Limiting**: Implemented on API endpoints (consider Cloudflare)
- [ ] **Monitoring**: Error tracking and logging set up
- [ ] **Refund Strategy**: Decided on automated vs manual refunds

### Operational Wallet (Refunds)

**HIGH RISK**: Automated refunds require private key on server.

**Recommended Approach**:
1. **Start with manual refunds** for security
2. Monitor refund queue: `npx prisma studio`
3. Process refunds manually from hardware wallet
4. Only automate if volume justifies the risk

If automating:
- Use dedicated operational wallet (not treasury)
- Keep minimal USDC balance
- Encrypt private key at rest
- Monitor for suspicious activity
- Rotate wallet periodically

---

## Monitoring & Maintenance

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs

# Monitor in real-time
pm2 monit

# Restart services
pm2 restart all
```

### Database Monitoring

```bash
# Open Prisma Studio
npm run db:studio

# Check MongoDB status
mongo --eval "db.adminCommand('serverStatus')"
```

### Health Checks

Create a health check endpoint for monitoring:

**app/api/health/route.ts**:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { testN8nConnection } from '@/lib/n8n-client';

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;

    // Test N8N connection
    const n8nHealthy = await testN8nConnection();

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      n8n: n8nHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
```

### Recommended Monitoring Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Logging**: Logtail, Papertrail
- **Performance**: New Relic, Datadog

### Backup Strategy

```bash
# Automated daily MongoDB backup
# Add to crontab: crontab -e
0 2 * * * mongodump --uri="$DATABASE_URL" --out=/backups/$(date +\%Y\%m\%d)
```

### Updates and Maintenance

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run database migrations (if any)
npm run db:push

# Rebuild application
npm run build

# Restart services
pm2 restart all
```

---

## Troubleshooting

### Issue: Payment verification failing

**Check**:
- Treasury wallet address is correct
- Network matches (mainnet vs devnet)
- USDC mint address is correct
- RPC endpoint is responding

### Issue: Jobs stuck in pending

**Check**:
- Queue worker is running: `pm2 status billz-queue`
- N8N is accessible: `curl $N8N_BASE_URL/healthz`
- Check worker logs: `pm2 logs billz-queue`

### Issue: Refunds not processing

**Check**:
- Refund processor is running: `pm2 status billz-refund`
- Operational wallet has SOL for gas fees
- Operational wallet has USDC balance
- Check refund logs: `pm2 logs billz-refund`

---

## Support

For deployment issues:
1. Check logs: `pm2 logs`
2. Review this documentation
3. Open an issue on GitHub

## Next Steps

After deployment:
1. Test on devnet first
2. Process a few mainnet transactions manually
3. Monitor for 24-48 hours
4. Gradually increase capacity
5. Set up automated monitoring alerts

---

**Last Updated**: 2024
