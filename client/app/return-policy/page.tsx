import React from 'react';

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-300">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-sm text-orange-500 uppercase tracking-widest mb-2">Predine</p>
          <h1 className="text-4xl font-bold text-gray-900">Return Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-8">
            Predine operates as a food pre-ordering platform. Given the nature of food and beverage products, our Return Policy is specific in scope. Please review the following policy carefully to understand what is and is not eligible for return or replacement.
          </p>

          {/* Section 1 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Nature of Our Products</h2>
            <p className="text-gray-700 mb-4">
              All items sold through Predine are freshly prepared food and beverage products sourced from our restaurant and dining establishment partners. Due to the following inherent characteristics, a traditional "return" of food products is generally not possible:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Food is perishable and cannot be restocked or resold</li>
              <li>Meals are prepared fresh upon order confirmation</li>
              <li>Hygiene and food safety regulations prevent the reuse of returned food items</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. No Return Policy</h2>
            <p className="text-gray-700 mb-4">
              <strong>Predine does not accept returns of any food or beverage items</strong> once they have been collected by the customer or delivered to the specified address. This applies to all orders regardless of the dining establishment, order type, or payment method used.
            </p>
            <p className="text-gray-700">
              By placing an order on Predine, you acknowledge and agree that food items are non-returnable by nature, and your purchase is considered final upon order pickup or delivery.
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Order Accuracy & Missing Items</h2>
            <p className="text-gray-700 mb-4">
              If you receive an order that is incorrect or incomplete compared to what was confirmed at checkout, please follow these steps:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 At the Time of Pickup</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Verify your order against the confirmation before leaving the establishment</li>
              <li>Report any missing or incorrect items to restaurant staff immediately</li>
              <li>If the issue cannot be resolved on-site, contact Predine support before leaving</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 For Delivered Orders</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Inspect your order upon delivery before the delivery personnel leaves</li>
              <li>Report any discrepancies to Predine support within <strong>30 minutes</strong> of delivery</li>
              <li>Provide photographic evidence of the incorrect or missing items</li>
            </ul>

            <p className="text-gray-700 mt-4">
              Predine will review such reports and liaise with the restaurant partner to determine appropriate resolution, which may include a partial refund or replacement, at Predine's sole discretion.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Food Quality Concerns</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Responsibility</h3>
            <p className="text-gray-700 mb-4">
              The quality and preparation of all food items are the primary responsibility of our restaurant partners. Predine acts as a platform intermediary and does not prepare or handle food directly.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Reporting a Quality Issue</h3>
            <p className="text-gray-700 mb-2">If you experience a genuine food quality concern such as:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Foreign objects found in food</li>
              <li>Clearly spoiled or unsafe food items</li>
              <li>Serious allergic reaction due to incorrect ingredient use</li>
            </ul>
            <p className="text-gray-700 mt-4 mb-2">Please take the following steps:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Do not consume the food if you suspect it is unsafe</li>
              <li>Document the issue with clear photographs</li>
              <li>Contact Predine support immediately at <a href="mailto:support@predine.com" className="text-blue-600 underline">support@predine.com</a></li>
              <li>Preserve the food item if possible for verification purposes</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Predine will escalate the matter to the concerned restaurant partner and, where warranted, take appropriate action including potential refund consideration.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Customization & Special Requests</h2>
            <p className="text-gray-700 mb-4">
              Predine allows users to add customization notes or special requests to their orders. Please note:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Special requests are not guaranteed and are fulfilled at the restaurant's discretion</li>
              <li>Unmet customization preferences do not automatically qualify for a return or refund</li>
              <li>Allergic dietary needs must be clearly communicated; Predine is not liable for allergic reactions arising from restaurant errors</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Uncollected Orders</h2>
            <p className="text-gray-700 mb-4">
              If a confirmed and prepared order is not collected within the designated 5-minute pickup window after preparation completion:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>The order may be disposed of by the restaurant establishment</li>
              <li>No return, replacement, or refund will be provided for uncollected orders</li>
              <li>Predine sends real-time notifications to avoid missed pickup windows — ensure your notifications are enabled</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Non-Food Items (if applicable)</h2>
            <p className="text-gray-700">
              In the event Predine introduces or facilitates the ordering of non-food products (such as packaged goods, merchandise, or accessories) in the future, a separate return policy applicable to those items will be communicated at the time of purchase. Until such notice is issued, this policy applies to all transactions on the platform.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-700 mb-3">For any concerns related to your order, contact our support team:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Email: <a href="mailto:support@predine.com" className="text-blue-600 underline">support@predine.com</a></li>
              <li>Phone: [Contact Number]</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Please contact us as soon as possible after the incident to ensure timely review of your concern.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Policy Updates</h2>
            <p className="text-gray-700">
              This Return Policy is subject to change at Predine's discretion. Significant updates will be communicated through the application or via email. Your continued use of Predine after any updates signifies acceptance of the revised policy.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-gray-600 mx-auto">
            Thank you for dining with Predine. We are committed to delivering quality and transparency in every order.
          </p>
        </div>
      </div>
    </div>
  );
}
