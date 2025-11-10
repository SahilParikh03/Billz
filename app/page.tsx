import { ExecuteAutomationButton } from '@/components/ExecuteAutomationButton';
import { AUTOMATION_PRICING } from '@/lib/x402-handler';

export default function HomePage() {
  const automations = Object.entries(AUTOMATION_PRICING);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Pay-Per-Use Automations
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Execute powerful automations with instant blockchain payments. Pay only
          for what you use, get refunded automatically if anything fails.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-semibold text-lg mb-2">Instant Payments</h3>
          <p className="text-gray-600 text-sm">
            Pay with USDC on Solana. Fast, secure, and transparent.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-3">🔄</div>
          <h3 className="font-semibold text-lg mb-2">Auto Refunds</h3>
          <p className="text-gray-600 text-sm">
            If execution fails, you get automatically refunded within 6 hours.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-3">🛡️</div>
          <h3 className="font-semibold text-lg mb-2">X-402 Protocol</h3>
          <p className="text-gray-600 text-sm">
            Industry-standard payment protocol for pay-per-use services.
          </p>
        </div>
      </div>

      {/* Available Automations */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Available Automations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {automations.map(([id, config]) => (
            <div
              key={id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {config.name}
                  </h3>
                  <p className="text-gray-600 mt-2">{config.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    ${config.priceUSDC.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">per execution</div>
                </div>
              </div>

              <ExecuteAutomationButton
                automationId={id}
                automationName={config.name}
                priceUSD={config.priceUSDC}
              />
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-semibold">Connect Wallet</h4>
            <p className="text-sm text-gray-600">
              Connect your Phantom wallet with USDC
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-semibold">Choose Automation</h4>
            <p className="text-sm text-gray-600">
              Select and execute the automation you need
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-semibold">Approve Payment</h4>
            <p className="text-sm text-gray-600">
              Confirm the USDC payment in your wallet
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <h4 className="font-semibold">Get Results</h4>
            <p className="text-sm text-gray-600">
              Receive results instantly or get auto-refunded
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
