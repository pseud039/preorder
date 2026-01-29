import React from 'react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-300">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Terms and Conditions</h1>
          {/* <p className="text-gray-600 mt-2">Effective Date: January 21, 2026</p> */}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-8">
            Welcome to Predine. By accessing or using our mobile application, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
          </p>

          {/* Section 1 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. About Predine</h2>
            <p className="text-gray-700 mb-4">
              Predine is a mobile application that enables users to pre-order meals from various dining establishments including restaurants, canteens, cafes, and bars. Our platform is designed to streamline the dining experience by reducing wait times and enhancing operational efficiency for both customers and restaurant partners.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1 Service Coverage</h3>
            <p className="text-gray-700 mb-2">Currently, Predine operates in the following areas:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Muradnagar</li>
              <li>Ghaziabad</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.2 Platform Features</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Pre-ordering capability across multiple dining venues</li>
              <li>Real-time order tracking</li>
              <li>Secure online payment processing</li>
              <li>Optional delivery service</li>
              <li>Customizable order preferences</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. User Eligibility</h2>
            <p className="text-gray-700 mb-2">By using Predine, you confirm that:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>You are at least 18 years of age or have parental/guardian consent</li>
              <li>You have the legal capacity to enter into binding contracts</li>
              <li>All information provided during registration is accurate and complete</li>
              <li>You will maintain the confidentiality of your account credentials</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Payment Terms</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Payment Methods</h3>
            <p className="text-gray-700 mb-4">
              Predine accepts online payments exclusively through approved payment gateways integrated within the application. Accepted payment methods include credit cards, debit cards, digital wallets, and other online payment systems as specified in the app.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Payment Processing</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>All payments must be completed before order confirmation</li>
              <li>Prices displayed include applicable taxes unless otherwise stated</li>
              <li>Payment authorization constitutes acceptance of the order</li>
            </ul>
          </section>

          {/* Section 4 - Refund Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Refund and Cancellation Policy</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 No Refund Policy</h3>
            <p className="font-semibold text-gray-900 mb-2">
              Once payment is processed and an order is confirmed, no refunds will be issued.
            </p>
            <p className="text-gray-700 mb-2">This strict policy exists because:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Food items are perishable in nature</li>
              <li>Orders are prepared immediately upon confirmation</li>
              <li>This policy helps reduce food wastage and promotes responsible ordering</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Refund Exceptions</h3>
            <p className="text-gray-700 mb-2">Predine may consider refund requests only in the following exceptional circumstances:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Technical failure resulting in non-fulfillment of order</li>
              <li>Establishment closure or inability to prepare the order</li>
              <li>System error leading to incorrect charges</li>
            </ul>
            <p className="text-gray-700 mt-4">
              All refund requests will be reviewed on a case-by-case basis. To request a refund under exceptional circumstances, contact our support team within 24 hours of the incident.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Order Modifications</h3>
            <p className="text-gray-700">
              Order modifications or cancellations are not permitted once payment is confirmed. Please review your order carefully before completing payment.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Order Pickup and Delivery</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Order Pickup</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Customers must collect their orders within a designated 5-minute window from the time of order preparation completion</li>
              <li>You will receive real-time notifications when your order is ready</li>
              <li>Please present order confirmation at the time of pickup</li>
              <li>Uncollected orders beyond the pickup window may be disposed of without refund</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Time Slot Selection</h3>
            <p className="text-gray-700 mb-3">Customers may select their preferred pickup time during the ordering process, subject to the following:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li><strong>Small Orders:</strong> Minimum preparation time of 5-10 minutes</li>
              <li><strong>Large Orders:</strong> Minimum preparation time of 20-30 minutes</li>
              <li>Time requirements may vary based on order complexity and establishment capacity</li>
              <li>Selected time slots are subject to availability</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3 Delivery Service</h3>
            <p className="text-gray-700 mb-2">If you are unable to collect your order in person, Predine offers a delivery service:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Provide accurate delivery address during order placement</li>
              <li>Delivery times are estimates and may vary based on distance and traffic conditions</li>
              <li>Delivery charges apply as specified during checkout</li>
              <li>You must be available to receive the order at the specified address</li>
              <li>Failed deliveries due to incorrect address or unavailability will not be refunded</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Responsibilities</h2>
            <p className="text-gray-700 mb-2">As a Predine user, you agree to:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Provide accurate and complete information during registration and ordering</li>
              <li>Order responsibly to minimize food wastage</li>
              <li>Arrive promptly during your selected pickup window</li>
              <li>Treat restaurant staff and delivery personnel with respect</li>
              <li>Not misuse the platform for fraudulent or unlawful purposes</li>
              <li>Not share your account credentials with others</li>
              <li>Notify us immediately of any unauthorized account access</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Restaurant Partner Terms</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.1 Operational Benefits</h3>
            <p className="text-gray-700 mb-2">Restaurant partners using Predine benefit from:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Improved resource allocation and staff scheduling</li>
              <li>Reduced food wastage through advance order information</li>
              <li>Enhanced customer satisfaction through streamlined operations</li>
              <li>Better inventory management</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.2 Partner Obligations</h3>
            <p className="text-gray-700 mb-2">Restaurant partners agree to:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Maintain accurate menu information and pricing</li>
              <li>Prepare orders within specified time frames</li>
              <li>Maintain food quality and safety standards</li>
              <li>Honor all confirmed orders</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy and Data Security</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.1 Information Collection</h3>
            <p className="text-gray-700 mb-2">Predine collects and processes personal information including:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Contact details (name, phone number, email address)</li>
              <li>Delivery addresses</li>
              <li>Payment information</li>
              <li>Order history and preferences</li>
              <li>Device information and usage data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.2 Data Usage</h3>
            <p className="text-gray-700 mb-2">Your information is used to:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Process and fulfill orders</li>
              <li>Improve our services</li>
              <li>Communicate order updates</li>
              <li>Provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.3 Data Protection</h3>
            <p className="text-gray-700 mb-4">
              Predine implements stringent security measures to protect your personal and payment information from unauthorized access, disclosure, or breaches. We are committed to maintaining the confidentiality and integrity of your data.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.4 Data Sharing</h3>
            <p className="text-gray-700 mb-2">We do not sell your personal information. Data may be shared with:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Restaurant partners (limited to order fulfillment information)</li>
              <li>Payment processors (for transaction processing)</li>
              <li>Delivery personnel (delivery address and contact information)</li>
              <li>Legal authorities (when required by law)</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Environmental Commitment</h2>
            <p className="text-gray-700 mb-3">
              Predine is committed to reducing food waste in the restaurant industry. According to industry research, restaurants waste between 4-10% of purchased food, with 30-40% of served food going uneaten. Our pre-ordering system helps:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Reduce overproduction and food wastage</li>
              <li>Optimize resource utilization</li>
              <li>Minimize greenhouse gas emissions from food disposal</li>
              <li>Promote sustainable dining practices</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Prohibited Activities</h2>
            <p className="text-gray-700 mb-2">Users must not:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Use the platform for illegal purposes</li>
              <li>Attempt to manipulate, hack, or disrupt the application</li>
              <li>Post false reviews or ratings</li>
              <li>Impersonate other users or entities</li>
              <li>Violate intellectual property rights</li>
              <li>Engage in fraudulent payment activities</li>
              <li>Abuse or harass restaurant staff or delivery personnel</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Intellectual Property</h2>
            <p className="text-gray-700">
              All content, features, and functionality of the Predine application, including but not limited to text, graphics, logos, images, and software, are the property of Predine and protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without express written permission.
            </p>
          </section>

          {/* Section 12 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Limitation of Liability</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.1 Service Availability</h3>
            <p className="text-gray-700 mb-2">Predine strives to maintain continuous service availability but does not guarantee uninterrupted access. We are not liable for:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Technical issues or system downtime</li>
              <li>Restaurant closures or unavailability</li>
              <li>Delays due to circumstances beyond our control</li>
              <li>Food quality issues (primary responsibility lies with restaurant partners)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.2 Maximum Liability</h3>
            <p className="text-gray-700">
              To the maximum extent permitted by law, Predine's total liability for any claims arising from use of our services shall not exceed the amount paid by you for the specific order in question.
            </p>
          </section>

          {/* Section 13 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">13.1 Customer Support</h3>
            <p className="text-gray-700 mb-4">
              For any concerns or disputes, please contact our customer support team through the application. We will make reasonable efforts to resolve issues promptly and fairly.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">13.2 Governing Law</h3>
            <p className="text-gray-700">
              These Terms and Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Ghaziabad, Uttar Pradesh.
            </p>
          </section>

          {/* Section 14 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Modifications to Terms</h2>
            <p className="text-gray-700">
              Predine reserves the right to modify these Terms and Conditions at any time. Users will be notified of significant changes through the application or via email. Continued use of the platform after modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Section 15 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Account Termination</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.1 User Termination</h3>
            <p className="text-gray-700 mb-4">
              You may terminate your account at any time by contacting customer support. Outstanding orders must be fulfilled or cancelled according to our policies before account closure.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.2 Predine Termination</h3>
            <p className="text-gray-700 mb-2">We reserve the right to suspend or terminate accounts that:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Violate these Terms and Conditions</li>
              <li>Engage in fraudulent activity</li>
              <li>Abuse the platform or other users</li>
              <li>Remain inactive for extended periods</li>
            </ul>
          </section>

          {/* Section 16 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Contact Information</h2>
            <p className="text-gray-700 mb-3">For questions, concerns, or support regarding these Terms and Conditions or our services, please contact us through:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              {/* <li>In-app customer support</li> */}
              <li>Email: support@predine.com</li>
              <li>Phone: [Contact Number]</li>
            </ul>
          </section>

          {/* Section 17 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By creating an account and using Predine, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* <p className="font-semibold text-gray-900 mb-2">Last Updated: January 21, 2026</p> */}
          <p className="text-gray-600 mx-auto">
            Thank you for choosing Predine. We look forward to serving you and enhancing your dining experience. 
          </p>
        </div>
      </div>
    </div>
  );
}