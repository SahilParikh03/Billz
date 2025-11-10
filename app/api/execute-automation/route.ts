import { NextRequest, NextResponse } from 'next/server';
  import { getX402Handler, getAutomationConfig } from '@/lib/x402-handler';
  import { createExecutionJob } from '@/lib/job-queue';
  import { db } from '@/lib/database';

  export async function POST(req: NextRequest) {
    const x402 = getX402Handler();

    try {
      // 1. Parse request body
      const body = await req.json();
      const { automationId, params = {} } = body;

      // 2. Get automation config (validates automationId)
      const automation = getAutomationConfig(automationId);

      // 3. Extract payment header
      const paymentHeader = x402.extractPayment(req.headers);

      // 4. Create payment requirements
      const paymentRequirements = await x402.createPaymentRequirements({
        price: {
          amount: automation.priceAtomicUnits,
          asset: {
            address: process.env.USDC_MINT_ADDRESS!
          }
        },
        network: process.env.NETWORK as 'solana' | 'solana-devnet',
        config: {
          description: automation.description,
          resource: `${process.env.NEXT_PUBLIC_API_URL}/api/execute-automation`,
          mimeType: 'application/json',
          maxTimeoutSeconds: 300,
        }
      });

      // 5. If no payment header, return 402
      if (!paymentHeader) {
        const response = x402.create402Response(paymentRequirements);
        return NextResponse.json(response.body, { status: 402 });
      }

      // 6. Verify payment
      const verified = await x402.verifyPayment(paymentHeader, paymentRequirements);
      if (!verified.isValid) {
        return NextResponse.json({
          error: 'Invalid payment',
          reason: verified.invalidReason
        }, { status: 402 });
      }

      // 7. Log payment to database
      const paymentRecord = await db.payment.create({
        data: {
          automationId,
          amountUsdc: BigInt(automation.priceAtomicUnits),
          paymentHeader,
          verifiedAt: new Date(),
          paymentRequirements: JSON.stringify(paymentRequirements),
        }
      });

      // 8. Create execution job (ASYNC - don't wait!)
      const job = await createExecutionJob({
        paymentId: paymentRecord.id,
        automationId,
        params,
        paymentHeader,
        paymentRequirements,
      });

      // 9. Return job ID immediately (user will poll for status)
      return NextResponse.json({
        success: true,
        jobId: job.id,
        status: 'pending',
        statusUrl: `/api/job/${job.id}/status`,
        message: 'Payment verified. Automation queued for execution.',
      });

    } catch (error: any) {
      console.error('Execute automation error:', error);
      return NextResponse.json({
        error: 'Internal server error',
        details: error.message
      }, { status: 500 });
    }
  }
