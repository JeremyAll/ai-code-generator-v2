export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto pt-8">
        <h1 className="text-4xl font-bold text-white text-center mb-12">Simple Pricing</h1>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free */}
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Free</h2>
            <p className="text-4xl font-bold text-white mb-6">€0<span className="text-lg text-gray-400">/month</span></p>
            <ul className="space-y-3 text-gray-300 mb-8">
              <li>✓ 3 projects/month</li>
              <li>✓ Basic templates</li>
              <li>✓ Export code</li>
            </ul>
            <button className="w-full py-3 bg-gray-700 text-white rounded-lg">Current Plan</button>
          </div>
          
          {/* Pro */}
          <div className="bg-gradient-to-b from-blue-900/20 to-purple-900/20 rounded-xl p-8 border border-blue-500/50 transform scale-105">
            <h2 className="text-2xl font-bold text-white mb-4">Pro</h2>
            <p className="text-4xl font-bold text-white mb-6">€19<span className="text-lg text-gray-400">/month</span></p>
            <ul className="space-y-3 text-gray-300 mb-8">
              <li>✓ Unlimited projects</li>
              <li>✓ GitHub integration</li>
              <li>✓ Figma import</li>
              <li>✓ Priority support</li>
            </ul>
            <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">Upgrade</button>
          </div>
          
          {/* Business */}
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Business</h2>
            <p className="text-4xl font-bold text-white mb-6">€49<span className="text-lg text-gray-400">/month</span></p>
            <ul className="space-y-3 text-gray-300 mb-8">
              <li>✓ Everything in Pro</li>
              <li>✓ API access</li>
              <li>✓ White label</li>
              <li>✓ Dedicated support</li>
            </ul>
            <button className="w-full py-3 bg-gray-700 text-white rounded-lg">Contact Sales</button>
          </div>
        </div>
      </div>
    </div>
  );
}