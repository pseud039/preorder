import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-300">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-sm text-orange-500 uppercase tracking-widest mb-2">Predine</p>
          <h1 className="text-4xl font-bold text-gray-900">Refund Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-8">
            At Predine, we strive to provide the best possible experience for our users. This Refund Policy outlines the terms under which refunds may be requested and processed. Please read this policy carefully before placing any orders.
          </p>

          {/* Section 1 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. General Refund Policy</h2>
            <p className="text-gray-700 mb-4">
              Due to the perishable nature of food products and the immediate preparation that begins upon order confirmation, <strong>all sales are final</strong>. Once payment is processed and an order is confirmed on the Predine platform, refunds will not be issued as a general rule.
            </p>
            <p className="text-gray-700">
              This policy ensures fairness to our restaurant partners, reduces food wastage, and encourages responsible ordering habits among our users.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligible Refund Circumstances</h2>
            <p className="text-gray-700 mb-4">
              Predine will consider refund requests strictly under the following exceptional circumstances:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Technical Failures</h3>
            <p className="text-gray-700 mb-2">A refund may be issued if:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>A technical error on our platform results in a failed or non-fulfilled order</li>
              <li>A system glitch causes a duplicate charge on your payment method</li>
              <li>Payment is deducted but no order confirmation is generated</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Restaurant-Side Issues</h3>
            <p className="text-gray-700 mb-2">A refund may be considered if:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>The restaurant partner is unable to fulfill a confirmed order due to sudden closure or operational failure</li>
              <li>The establishment is unable to prepare the ordered items due to ingredient unavailability after confirmation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.3 Incorrect Charges</h3>
            <p className="text-gray-700">
              If a system error results in an incorrect amount being charged — different from what was displayed at checkout — the difference will be refunded after verification.
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Non-Refundable Situations</h2>
            <p className="text-gray-700 mb-2">Refunds will <strong>not</strong> be issued in the following situations:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Change of mind after payment confirmation</li>
              <li>Failure to collect an order within the designated 5-minute pickup window</li>
              <li>Food quality dissatisfaction (quality responsibility lies with the restaurant partner)</li>
              <li>Incorrect delivery address provided by the user</li>
              <li>User unavailability at the time of delivery</li>
              <li>Delays caused by traffic, weather, or other factors outside Predine's control</li>
              <li>Order quantity or item selection errors made by the user</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How to Request a Refund</h2>
            <p className="text-gray-700 mb-4">
              If you believe you qualify for a refund under the eligible circumstances listed above, follow these steps:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li><strong>Step 1:</strong> Contact our support team within <strong>24 hours</strong> of the incident at <a href="mailto:support@predine.com" className="text-blue-600 underline">support@predine.com</a></li>
              <li><strong>Step 2:</strong> Provide your order ID, registered phone number or email, and a brief description of the issue</li>
              <li><strong>Step 3:</strong> Attach any supporting evidence such as screenshots, error messages, or payment receipts</li>
              <li><strong>Step 4:</strong> Our support team will review your request and respond within 3–5 business days</li>
            </ul>

            <p className="text-gray-700 mt-6">
              Refund requests submitted after the 24-hour window will not be entertained, regardless of circumstances.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Refund Processing</h2>
            <p className="text-gray-700 mb-4">
              If a refund is approved, it will be processed as follows:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Refunds will be credited to the original payment method used during the transaction</li>
              <li>Processing time is typically <strong>5–10 business days</strong>, depending on your bank or payment provider</li>
              <li>Predine is not responsible for delays caused by financial institutions</li>
              <li>You will be notified via email or in-app notification once the refund is initiated</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Dispute Escalation</h2>
            <p className="text-gray-700 mb-4">
              If your refund request is denied and you believe the decision is incorrect, you may escalate the matter by:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Replying to the support thread with additional supporting evidence</li>
              <li>Requesting a review by our senior support team</li>
            </ul>
            <p className="text-gray-700 mt-4">
              All decisions made by Predine's senior support team are final. Disputes unresolved through our support process are subject to the governing law and jurisdiction outlined in our Terms and Conditions.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Policy Updates</h2>
            <p className="text-gray-700">
              Predine reserves the right to amend this Refund Policy at any time. Changes will be communicated through the application or via email. Continued use of the platform after any modification constitutes your acceptance of the revised policy.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-700 mb-3">For refund-related queries, reach out to us via:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Email: <a href="mailto:support@predine.com" className="text-blue-600 underline">support@predine.com</a></li>
              <li>Phone: [Contact Number]</li>
            </ul>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 bg-gray-50 py-4">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-gray-600 mx-auto">
            Thank you for choosing Predine. We are committed to resolving your concerns fairly and promptly.
          </p>
        </div>
      </div>
    </div>
  );
}
