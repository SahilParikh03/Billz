import axios from 'axios';

/**
 * N8N Workflow Client
 * Executes N8N workflows via webhook or API
 */

// N8N Configuration
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

/**
 * Workflow mapping - Maps automation IDs to N8N workflow IDs or webhook URLs
 */
const WORKFLOW_MAPPING: Record<string, { type: 'webhook' | 'api'; endpoint: string }> = {
  'cs-skin-scraper': {
    type: 'webhook',
    endpoint: '/webhook/cs-skin-scraper', // N8N webhook path
  },
  'email-automation': {
    type: 'webhook',
    endpoint: '/webhook/email-automation',
  },
  // Add more automation mappings here
};

/**
 * Execute an N8N workflow by automation ID
 * @param automationId - The automation identifier
 * @param params - Parameters to pass to the workflow
 * @returns Workflow execution result
 */
export async function executeN8nWorkflow(
  automationId: string,
  params: Record<string, any>
): Promise<any> {
  const workflow = WORKFLOW_MAPPING[automationId];

  if (!workflow) {
    throw new Error(`No N8N workflow mapped for automation: ${automationId}`);
  }

  try {
    if (workflow.type === 'webhook') {
      return await executeViaWebhook(workflow.endpoint, params);
    } else {
      return await executeViaAPI(workflow.endpoint, params);
    }
  } catch (error: any) {
    console.error(`N8N execution failed for ${automationId}:`, error.message);
    throw new Error(`Workflow execution failed: ${error.message}`);
  }
}

/**
 * Execute workflow via N8N webhook
 * This is the recommended method - more reliable and simpler
 */
async function executeViaWebhook(
  webhookPath: string,
  params: Record<string, any>
): Promise<any> {
  const url = `${N8N_BASE_URL}${webhookPath}`;

  console.log(`📤 Calling N8N webhook: ${url}`);

  const response = await axios.post(
    url,
    {
      ...params,
      timestamp: new Date().toISOString(),
    },
    {
      timeout: 300000, // 5 minutes timeout
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(`N8N webhook returned status ${response.status}`);
  }

  console.log(`✅ N8N webhook completed successfully`);

  return response.data;
}

/**
 * Execute workflow via N8N API
 * Requires API key and workflow ID
 */
async function executeViaAPI(
  workflowId: string,
  params: Record<string, any>
): Promise<any> {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY not configured');
  }

  const url = `${N8N_BASE_URL}/api/v1/workflows/${workflowId}/execute`;

  console.log(`📤 Executing N8N workflow via API: ${workflowId}`);

  const response = await axios.post(
    url,
    {
      data: params,
    },
    {
      timeout: 300000, // 5 minutes
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    }
  );

  if (!response.data || response.data.finished === false) {
    throw new Error('N8N workflow execution failed or did not complete');
  }

  console.log(`✅ N8N API execution completed`);

  return response.data;
}

/**
 * Test N8N connection
 * Use this to verify N8N is reachable
 */
export async function testN8nConnection(): Promise<boolean> {
  try {
    const response = await axios.get(`${N8N_BASE_URL}/healthz`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('N8N connection test failed:', error);
    return false;
  }
}

/**
 * Get workflow execution status (if using async execution)
 * @param executionId - N8N execution ID
 */
export async function getExecutionStatus(executionId: string): Promise<any> {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY not configured');
  }

  const url = `${N8N_BASE_URL}/api/v1/executions/${executionId}`;

  const response = await axios.get(url, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
    },
  });

  return response.data;
}
