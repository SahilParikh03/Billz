module.exports = {
    apps: [
      {
        name: 'billz-web',
        script: 'npm',
        args: 'start',
        env: {
          NODE_ENV: 'production',
        }
      },
      {
        name: 'billz-queue',
        script: './lib/job-queue.ts',
        interpreter: 'node',
        interpreter_args: '--loader ts-node/esm',
        env: {
          NODE_ENV: 'production',
        }
      },
      {
        name: 'billz-refund',
        script: './lib/refund-processor.ts',
        interpreter: 'node',
        interpreter_args: '--loader ts-node/esm',
        env: {
          NODE_ENV: 'production',
        }
      }
    ]
  };
