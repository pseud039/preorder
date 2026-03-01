import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-300">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-sm text-orange-500 uppercase tracking-widest mb-2">Predine</p>
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-8">
            Predine ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it when you use our mobile application and services.
          </p>
          <p className="text-gray-700 mb-8">
            By using Predine, you consent to the practices described in this Privacy Policy. If you do not agree with this policy, please discontinue use of our application.
          </p>

          {/* Section 1 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">We collect information you provide directly to us and information generated through your use of our platform.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1 Information You Provide</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li><strong>Account Information:</strong> Full name, email address, phone number, and password upon registration</li>
              <li><strong>Profile Details:</strong> Profile picture and personal preferences (optional)</li>
              <li><strong>Order Information:</strong> Items ordered, customization preferences, and special instructions</li>
              <li><strong>Payment Information:</strong> Credit/debit card details, UPI IDs, or digital wallet credentials (processed securely through third-party payment gateways)</li>
              <li><strong>Delivery Information:</strong> Delivery address, landmark notes, and contact number for delivery</li>
              <li><strong>Support Communications:</strong> Any messages, complaints, or feedback you submit to our support team</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.2 Information Collected Automatically</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time and duration of sessions, and in-app interactions</li>
              <li><strong>Location Data:</strong> With your permission, approximate or precise location to show nearby dining establishments</li>
              <li><strong>Log Data:</strong> IP address, app crashes, system activity, and diagnostics</li>
              <li><strong>Cookies & Similar Technologies:</strong> Session tokens and app analytics identifiers</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-2">We use the information we collect for the following purposes:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Service Delivery</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Processing and fulfilling food orders</li>
              <li>Coordinating pickup and delivery logistics</li>
              <li>Sending order confirmations, updates, and notifications</li>
              <li>Enabling real-time order tracking</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Account Management</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Creating and managing your Predine account</li>
              <li>Verifying your identity and preventing fraud</li>
              <li>Responding to support requests and resolving disputes</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.3 Platform Improvement</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Analyzing usage trends to improve features and user experience</li>
              <li>Conducting research and development for new services</li>
              <li>Monitoring app performance and identifying technical issues</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.4 Communications</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Sending promotional offers, deals, and personalized recommendations (with your consent)</li>
              <li>Notifying you of changes to our policies or services</li>
              <li>Sharing important service announcements</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.5 Legal Compliance</h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Complying with applicable laws, regulations, and legal processes</li>
              <li>Protecting the rights, safety, and property of Predine, its users, and the public</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Share Your Information</h2>
            <p className="text-gray-700 mb-4">
              Predine does not sell, rent, or trade your personal information to third parties. We may share your data only in the following limited circumstances:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Restaurant Partners</h3>
            <p className="text-gray-700">
              Order details (items ordered, customization preferences, pickup time) are shared with the relevant restaurant establishment solely for the purpose of order fulfillment. Restaurants do not receive your payment information.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Payment Processors</h3>
            <p className="text-gray-700">
              Payment information is securely transmitted to our third-party payment gateway partners for transaction processing. Predine does not store complete card or UPI credentials on our servers.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Delivery Partners</h3>
            <p className="text-gray-700">
              For delivery orders, your name, delivery address, and contact number are shared with the assigned delivery personnel to facilitate successful delivery.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.4 Service Providers</h3>
            <p className="text-gray-700">
              We may engage trusted third-party service providers (e.g., analytics, cloud hosting, customer support tools) who process data on our behalf under strict confidentiality agreements.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.5 Legal Requirements</h3>
            <p className="text-gray-700">
              We may disclose your information to law enforcement, government agencies, or other parties when required by law, court order, or legal process.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.6 Business Transfers</h3>
            <p className="text-gray-700">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. You will be notified of any such change in ownership and applicable privacy policy updates.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as your account is active or as needed to provide you with our services. Specifically:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Account data is retained until you request account deletion</li>
              <li>Order history is retained for up to <strong>3 years</strong> for accounting and dispute resolution purposes</li>
              <li>Payment transaction records are retained as required by applicable financial regulations</li>
              <li>Support communication records are retained for up to <strong>1 year</strong> after resolution</li>
            </ul>
            <p className="text-gray-700 mt-4">
              After the applicable retention period, data is securely deleted or anonymized.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your personal and financial data, including:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>SSL/TLS encryption for all data transmitted between your device and our servers</li>
              <li>Secure storage with access controls and role-based permissions</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Tokenization of sensitive payment data via PCI-DSS compliant payment gateways</li>
            </ul>
            <p className="text-gray-700 mt-4">
              While we take all reasonable precautions, no system is completely immune to breaches. In the event of a data breach that affects your personal information, we will notify you as required by applicable law.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="text-gray-700 mb-4">Depending on applicable law, you may have the following rights regarding your personal data:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1 Right to Access</h3>
            <p className="text-gray-700">You may request a copy of the personal information we hold about you.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2 Right to Correction</h3>
            <p className="text-gray-700">You may request correction of inaccurate or incomplete personal data. You can also update most information directly within the app settings.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.3 Right to Deletion</h3>
            <p className="text-gray-700">You may request deletion of your account and associated personal data, subject to legal retention obligations.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.4 Right to Withdraw Consent</h3>
            <p className="text-gray-700">Where we rely on your consent to process data (e.g., marketing communications), you may withdraw consent at any time through the app's notification settings.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.5 Right to Object</h3>
            <p className="text-gray-700">You may object to certain processing activities, such as direct marketing, at any time.</p>

            <p className="text-gray-700 mt-6">
              To exercise any of these rights, contact us at <a href="mailto:support@predine.com" className="text-blue-600 underline">support@predine.com</a>. We will respond within 30 days of receiving your request.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              Predine uses session tokens and analytics identifiers to maintain your login session and understand how users interact with the app. These are not traditional browser cookies but function similarly within the mobile application environment.
            </p>
            <p className="text-gray-700">
              You may limit data collection by adjusting your device's app permissions (e.g., disabling location access). Note that some features may not function fully without certain permissions enabled.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Predine is not intended for use by individuals under the age of 18 without parental or guardian consent. We do not knowingly collect personal information from children under 18. If we become aware that we have collected data from a minor without appropriate consent, we will take steps to delete that information promptly.
            </p>
            <p className="text-gray-700">
              If you believe a child has provided us with personal information without proper consent, please contact us at <a href="mailto:support@predine.com" className="text-blue-600 underline">support@predine.com</a>.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Links and Services</h2>
            <p className="text-gray-700">
              Our platform may contain links to third-party websites, payment portals, or services. This Privacy Policy does not apply to those third-party services. We encourage you to review the privacy policies of any third-party services you interact with through our platform.
            </p>
          </section>

          {/* Section 10 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Grievance Redressal</h2>
            <p className="text-gray-700 mb-4">
              In accordance with applicable Indian law (including the Information Technology Act, 2000 and its amendments), if you have any grievances regarding the processing of your personal data, you may contact our Grievance Officer:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li><strong>Name:</strong> [Grievance Officer Name]</li>
              <li><strong>Email:</strong> <a href="mailto:support@predine.com" className="text-blue-600 underline">support@predine.com</a></li>
              <li><strong>Address:</strong> Ghaziabad, Uttar Pradesh, India</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We will acknowledge your grievance within 48 hours and resolve it within 30 days.
            </p>
          </section>

          {/* Section 11 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify you of significant changes through the application or via email. The updated policy will indicate the revised effective date. Your continued use of Predine following notification constitutes your acceptance of the changes.
            </p>
          </section>

          {/* Section 12 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-3">If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Email: <a href="mailto:support@predine.com" className="text-blue-600 underline">support@predine.com</a></li>
              <li>Phone: [Contact Number]</li>
              <li>Address: Ghaziabad, Uttar Pradesh, India</li>
            </ul>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-gray-600 mx-auto">
            Your privacy matters to us. Predine is committed to being transparent about how we collect and use your data.
          </p>
        </div>
      </div>
    </div>
  );
}
