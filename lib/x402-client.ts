import { createX402Client } from 'x402-solana/client';
  import { useWallet } from '@solana/wallet-adapter-react';

  export function useX402Client() {
    const wallet = useWallet();

    if (!wallet.connected || !wallet.publicKey) {
      return null;
    }

    // Create x402 client with connected Phantom wallet
    return createX402Client({
      wallet: {
        publicKey: wallet.publicKey,
        address: wallet.publicKey.toString(),
        signTransaction: wallet.signTransaction!,
      },
      network: process.env.NEXT_PUBLIC_NETWORK as 'solana' | 'solana-devnet',
      maxPaymentAmount: BigInt(100_000_000), // Safety: Max $100 USDC per tx
    });
  }

  File: components/ExecuteAutomationButton.tsx

  'use client';

  import { useState } from 'react';
  import { useWallet } from '@solana/wallet-adapter-react';
  import { useX402Client } from '@/lib/x402-client';

  interface Props {
    automationId: string;
    automationName: string;
    priceUSD: number;
  }

  export function ExecuteAutomationButton({ 
    automationId, 
    automationName, 
    priceUSD 
  }: Props) {
    const { connected, connect } = useWallet();
    const x402Client = useX402Client();
    const [loading, setLoading] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');

    const handleExecute = async () => {
      if (!connected) {
        await connect();
        return;
      }

      if (!x402Client) {
        alert('Please connect your wallet');
        return;
      }

      setLoading(true);
      setStatus('Processing payment...');

      try {
        // This automatically handles 402 payment flow!
        const response = await x402Client.fetch('/api/execute-automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            automationId,
            params: {} // User-specific params if needed
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Execution failed');
        }

        const data = await response.json();
        setJobId(data.jobId);
        setStatus('Automation queued');

        // Poll for status
        pollJobStatus(data.jobId);

      } catch (error: any) {
        console.error('Execution error:', error);
        setStatus(`Error: ${error.message}`);
        setLoading(false);
      }
    };

    const pollJobStatus = async (jobId: string) => {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/job/${jobId}/status`);
          const data = await response.json();

          setStatus(`Status: ${data.status}`);

          if (data.status === 'completed') {
            clearInterval(interval);
            setStatus('Completed! Results: ' + JSON.stringify(data.result));
            setLoading(false);
          } else if (data.status === 'failed') {
            clearInterval(interval);
            setStatus(`Failed: ${data.error}. Refund will be processed within 6 hours.`);
            setLoading(false);
          }
        } catch (error) {
          console.error('Status poll error:', error);
        }
      }, 3000); // Poll every 3 seconds
    };

    return (
      <div className="space-y-4">
        <button
          onClick={handleExecute}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Execute for $${priceUSD}`}
        </button>

        {status && (
          <div className="p-4 bg-gray-100 rounded">
            <p className="text-sm">{status}</p>
            {jobId && (
              <p className="text-xs text-gray-600 mt-2">Job ID: {jobId}</p>
            )}
          </div>
        )}
      </div>
    );
  }
