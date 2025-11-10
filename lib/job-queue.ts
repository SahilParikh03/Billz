import { db } from './database';
  import { executeN8nWorkflow } from './n8n-client';
  import { getX402Handler } from './x402-handler';

  export async function createExecutionJob(data: {
    paymentId: string;
    automationId: string;
    params: any;
    paymentHeader: string;
    paymentRequirements: any;
  }) {
    return await db.execution.create({
      data: {
        paymentId: data.paymentId,
        automationId: data.automationId,
        params: data.params,
        paymentHeader: data.paymentHeader,
        paymentRequirements: JSON.stringify(data.paymentRequirements),
        status: 'pending',
        createdAt: new Date(),
      }
    });
  }

  // Background worker - run this separately
  export async function processExecutionQueue() {
    console.log('🔄 Execution queue worker started');

    while (true) {
      try {
        // Get oldest pending job
        const job = await db.execution.findFirst({
          where: { status: 'pending' },
          orderBy: { createdAt: 'asc' },
          include: { payment: true }
        });

        if (!job) {
          // No jobs, wait 2 seconds
          await sleep(2000);
          continue;
        }

        console.log(`▶️ Processing job ${job.id}`);

        // Update status to running
        await db.execution.update({
          where: { id: job.id },
          data: {
            status: 'running',
            startedAt: new Date()
          }
        });

        // Execute automation with retry logic
        const result = await executeWithRetry(job);

        if (result.success) {
          // Success: Settle payment
          const x402 = getX402Handler();
          const paymentRequirements = JSON.parse(job.paymentRequirements);

          await x402.settlePayment(job.paymentHeader, paymentRequirements);

          // Update payment as settled
          await db.payment.update({
            where: { id: job.paymentId },
            data: { settledAt: new Date() }
          });

          // Update job as completed
          await db.execution.update({
            where: { id: job.id },
            data: {
              status: 'completed',
              result: result.data,
              completedAt: new Date(),
              durationSeconds: Math.floor((Date.now() - job.createdAt.getTime()) / 1000)
            }
          });

          console.log(`✅ Job ${job.id} completed`);

        } else {
          // Failed: Mark for refund
          await db.execution.update({
            where: { id: job.id },
            data: {
              status: 'failed',
              error: result.error,
              completedAt: new Date(),
            }
          });

          // Mark payment for refund
          await db.payment.update({
            where: { id: job.paymentId },
            data: {
              refundStatus: 'pending',
              refundReason: result.error
            }
          });

          console.log(`❌ Job ${job.id} failed: ${result.error}`);
        }

      } catch (error: any) {
        console.error('Queue processing error:', error);
        await sleep(5000); // Wait 5s on error before retry
      }
    }
  }

  async function executeWithRetry(job: any, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} for job ${job.id}`);

        // Execute n8n workflow
        const result = await executeN8nWorkflow(job.automationId, job.params);

        return { success: true, data: result };

      } catch (error: any) {
        console.error(`Attempt ${attempt} failed:`, error.message);

        if (attempt === maxRetries) {
          // All retries exhausted
          return {
            success: false,
            error: `Failed after ${maxRetries} attempts: ${error.message}`
          };
        }

        // Wait before retry (exponential backoff)
        await sleep(1000 * Math.pow(2, attempt)); // 2s, 4s, 8s
      }
    }

    return { success: false, error: 'Unknown error' };
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Run worker in separate process or as background task
  if (require.main === module) {
    processExecutionQueue().catch(console.error);
  }
