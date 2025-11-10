import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
  import { getAssociatedTokenAddress, createTransferCheckedInstruction } from '@solana/spl-token';
  import { db } from './database';

  // IMPORTANT: Only create this if handling refunds from operational wallet
  // For treasury refunds, do manual withdrawals for security
  export async function processRefunds() {
    console.log('🔄 Refund processor started');

    while (true) {
      try {
        // Get pending refunds
        const pendingRefunds = await db.payment.findMany({
          where: { refundStatus: 'pending' },
          include: { execution: true },
          take: 10, // Process 10 at a time
        });

        for (const payment of pendingRefunds) {
          // Auto-approve if execution failed after retries
          if (payment.execution?.status === 'failed') {
            await approveRefund(payment.id);
          }

          // TODO: Add manual review logic for edge cases
        }

        // Process approved refunds
        const approvedRefunds = await db.payment.findMany({
          where: { refundStatus: 'approved' },
          take: 5, // Process 5 at a time
        });

        for (const payment of approvedRefunds) {
          try {
            const txSignature = await executeRefund(payment);

            await db.payment.update({
              where: { id: payment.id },
              data: {
                refundStatus: 'completed',
                refundTxSignature: txSignature,
                refundedAt: new Date(),
              }
            });

            console.log(`✅ Refund completed: ${payment.id} (${txSignature})`);

          } catch (error: any) {
            console.error(`❌ Refund failed for ${payment.id}:`, error);
            // Keep status as 'approved' to retry later
          }
        }

        await sleep(10000); // Check every 10 seconds

      } catch (error) {
        console.error('Refund processor error:', error);
        await sleep(30000); // Wait 30s on error
      }
    }
  }

  async function approveRefund(paymentId: string) {
    await db.payment.update({
      where: { id: paymentId },
      data: { refundStatus: 'approved' }
    });
    console.log(`✓ Refund approved: ${paymentId}`);
  }

  async function executeRefund(payment: any): Promise<string> {
    // SECURITY WARNING: This requires operational wallet private key
    // Only use if you're comfortable with hot wallet risk

    // For maximum security, do manual refunds from treasury via hardware wallet
    // This function is provided for automation, but adds risk

    const connection = new Connection(process.env.SOLANA_RPC_URL!);

    // Decode payment header to get user's wallet address
    const paymentPayload = JSON.parse(
      Buffer.from(payment.paymentHeader, 'base64').toString()
    );
    const userWallet = new PublicKey(paymentPayload.payload.sender);

    // Load operational wallet (ENCRYPTED private key required)
    const operationalKeypair = Keypair.fromSecretKey(
      Buffer.from(process.env.OPERATIONAL_WALLET_PRIVATE_KEY!, 'base64')
    );

    // Get token accounts
    const usdcMint = new PublicKey(process.env.USDC_MINT_ADDRESS!);
    const sourceATA = await getAssociatedTokenAddress(usdcMint, operationalKeypair.publicKey);
    const destATA = await getAssociatedTokenAddress(usdcMint, userWallet);

    // Create refund transaction
    const transaction = new Transaction().add(
      createTransferCheckedInstruction(
        sourceATA,
        usdcMint,
        destATA,
        operationalKeypair.publicKey,
        BigInt(payment.amountUsdc),
        6 // USDC decimals
      )
    );

    // Send transaction
    const signature = await connection.sendTransaction(transaction, [operationalKeypair]);
    await connection.confirmTransaction(signature);

    return signature;
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
