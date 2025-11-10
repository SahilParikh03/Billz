import { NextRequest, NextResponse } from 'next/server';
     import { db } from '@/lib/database';

     /**
      * GET /api/job/{jobId}/status
      * Returns the current status of a job execution
      */
     export async function GET(
       req: NextRequest,
       { params }: { params: { jobId: string } }
     ) {
       try {
         const { jobId } = params;

         // Fetch execution record from database
         const execution = await db.execution.findUnique({
           where: { id: jobId },
           include: {
             payment: true, // Include payment info
           },
         });

         // Job not found
         if (!execution) {
           return NextResponse.json(
             {
               error: 'Job not found',
               jobId,
             },
             { status: 404 }
           );
         }

         // Build response based on status
         const response: any = {
           jobId: execution.id,
           status: execution.status,
           automationId: execution.automationId,
           createdAt: execution.createdAt,
           startedAt: execution.startedAt,
           completedAt: execution.completedAt,
         };

         // Add status-specific information
         switch (execution.status) {
           case 'pending':
             response.message = 'Job is queued and waiting to be processed';
             break;

           case 'running':
             response.message = 'Job is currently being executed';
             response.startedAt = execution.startedAt;
             break;

           case 'completed':
             response.message = 'Job completed successfully';
             response.result = execution.result;
             response.durationSeconds = execution.durationSeconds;
             response.paymentSettled = execution.payment.settledAt !== null;
             break;

           case 'failed':
             response.message = 'Job execution failed';
             response.error = execution.error;
             response.refundStatus = execution.payment.refundStatus || 'pending';
             response.refundMessage =
               'A refund will be processed automatically within 6 hours';
             break;
         }

         return NextResponse.json(response);
       } catch (error: any) {
         console.error('Job status query error:', error);
         return NextResponse.json(
           {
             error: 'Failed to fetch job status',
             details: error.message,
           },
           { status: 500 }
         );
       }
     }
