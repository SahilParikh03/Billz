import { X402PaymentHandler } from 'x402-solana/server';

  // Singleton instance
  let x402Handler: X402PaymentHandler | null = null;

  export function getX402Handler() {
    if (!x402Handler) {
      x402Handler = new X402PaymentHandler({
        network: process.env.NETWORK as 'solana' | 'solana-devnet',
        treasuryAddress: process.env.TREASURY_WALLET_ADDRESS!,
        facilitatorUrl: 'https://facilitator.payai.network',
        rpcUrl: process.env.SOLANA_RPC_URL, // Optional: custom RPC
      });
    }
    return x402Handler;
  }

  // Static pricing configuration
  export const AUTOMATION_PRICING = {
    'cs-skin-scraper': {
      name: 'CS Skin Price Scraper',
      priceUSDC: 2.50,
      priceAtomicUnits: '2500000', // $2.50 in micro-units
      description: 'Scrape CS skin prices from 20+ websites',
    },
    'email-automation': {
      name: 'Email Automation',
      priceUSDC: 0.50,
      priceAtomicUnits: '500000', // $0.50
      description: 'Automated email workflow',
    },
    // Add more automations here
  } as const;

  export type AutomationId = keyof typeof AUTOMATION_PRICING;

  export function getAutomationConfig(automationId: string) {
    const config = AUTOMATION_PRICING[automationId as AutomationId];
    if (!config) {
      throw new Error(`Unknown automation: ${automationId}`);
    }
    return config;
  }
