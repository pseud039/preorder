import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function TermsAndConditionsContent() {
  return (
    <>
      <h2 className="mt-8 text-center">Terms and Conditions</h2>

      <p>
        <strong>Effective Date:</strong> June 1, 2025
      </p>
      <p>
        <strong>Last Updated:</strong> June 1, 2025
      </p>
      <p>
        <strong>Jurisdiction:</strong> Ghaziabad, Uttar Pradesh, India
      </p>

      <h3>1. Acceptance of Terms</h3>
      <p>
        By downloading, registering, accessing, or using the Predine mobile
        application (the "App") or any related services, you agree to be bound
        by these Terms and Conditions. If you do not agree, please do not use
        our services.
      </p>

      <h3>2. Definitions</h3>
      <ul>
        <li>
          <strong>App</strong> - The Predine mobile application available on iOS
          and Android.
        </li>
        <li>
          <strong>User</strong> - Any individual accessing or using the App.
        </li>
        <li>
          <strong>Restaurant Partner</strong> - Any restaurant, café, canteen,
          bar, or food establishment registered on Predine.
        </li>
        <li>
          <strong>Order</strong> - A request to purchase food or beverages
          submitted through the App.
        </li>
        <li>
          <strong>Pre-Order</strong> - An order placed in advance of pickup or
          delivery.
        </li>
        <li>
          <strong>Services</strong> - All features including pre-ordering,
          payments, tracking, and delivery.
        </li>
        <li>
          <strong>Content</strong> - Text, images, graphics, logos, data,
          software and other materials.
        </li>
        <li>
          <strong>Personal Data</strong> - Data as defined under the IT Act 2000
          and DPDP Act 2023.
        </li>
        <li>
          <strong>Payment Gateway</strong> - Third-party payment processing
          services integrated into the App.
        </li>
      </ul>

      <h3>3. User Eligibility & Obligations</h3>

      <h4>3.1 Eligibility</h4>
      <ul>
        <li>Be at least 18 years old or have parental consent.</li>
        <li>
          Have legal capacity to enter contracts under the Indian Contract Act,
          1872.
        </li>
        <li>Provide accurate registration information.</li>
        <li>Maintain confidentiality of account credentials.</li>
        <li>Not previously suspended from the App.</li>
      </ul>

      <h4>3.2 User Obligations</h4>
      <ul>
        <li>Use the App only for lawful purposes.</li>
        <li>Place genuine orders.</li>
        <li>Arrive within the designated pickup window.</li>
        <li>Treat restaurant partners and delivery staff respectfully.</li>
        <li>Report unauthorized account activity to support@predine.in.</li>
        <li>Do not share account credentials.</li>
      </ul>

      <h4>3.3 Prohibited Activities</h4>
      <ul>
        <li>Fraudulent or unlawful use of the App.</li>
        <li>Hacking, reverse engineering, or disrupting the platform.</li>
        <li>Submitting misleading reviews.</li>
        <li>Impersonation or misrepresentation.</li>
        <li>IP infringement.</li>
        <li>Fraudulent payment activities.</li>
        <li>Harassment or abuse of partners or delivery staff.</li>
        <li>Using bots or automated scripts.</li>
        <li>Uploading malware or harmful code.</li>
      </ul>

      <h3>4. About Predine & Service Coverage</h3>
      <p>
        Predine is a technology platform allowing users to pre-order meals from
        registered restaurant partners.
      </p>

      <h4>4.1 Current Service Areas</h4>
      <ul>
        <li>Muradnagar, Uttar Pradesh</li>
        <li>Ghaziabad, Uttar Pradesh</li>
      </ul>

      <h4>4.2 Platform Features</h4>
      <ul>
        <li>Pre-ordering across venues</li>
        <li>Real-time order tracking</li>
        <li>Secure payments</li>
        <li>Optional delivery</li>
        <li>Custom order preferences</li>
      </ul>

      <h3>5. Pricing & Payments</h3>

      <h4>5.1 Pricing</h4>
      <p>
        All prices are displayed in Indian Rupees (INR) and include applicable
        GST unless otherwise stated.
      </p>

      <h4>5.2 Accepted Payment Methods</h4>
      <ul>
        <li>Credit / Debit Cards</li>
        <li>UPI</li>
        <li>Net Banking</li>
        <li>Approved Digital Wallets</li>
      </ul>

      <p>Cash payments are not accepted.</p>

      <h4>5.3 Payment Processing</h4>
      <ul>
        <li>Payment must be completed before order confirmation.</li>
        <li>Payment authorization confirms the order.</li>
        <li>Failed payments will not create an order.</li>
        <li>Predine does not store full card details.</li>
      </ul>

      <h4>5.4 Billing Disputes</h4>
      <p>
        Contact support@predine.in within 24 hours of a suspected incorrect
        charge.
      </p>

      <h3>6. Refund and Cancellation Policy</h3>

      <h4>6.1 No Refund Policy</h4>
      <p>
        Due to the perishable nature of food, orders cannot be cancelled or
        refunded after confirmation.
      </p>

      <h4>6.2 Exceptional Circumstances</h4>
      <ul>
        <li>Technical platform failure</li>
        <li>Restaurant partner unable to fulfil order</li>
        <li>System error causing duplicate or incorrect charges</li>
      </ul>

      <h4>6.3 Order Modifications</h4>
      <p>Orders cannot be modified once payment is confirmed.</p>

      <h3>7. Order Pickup and Delivery</h3>

      <h4>7.1 Pickup</h4>
      <ul>
        <li>Orders must be collected within 5 minutes of readiness.</li>
        <li>Users receive notifications when the order is ready.</li>
        <li>QR code or order ID must be presented.</li>
      </ul>

      <h4>7.2 Time Slot Selection</h4>
      <ul>
        <li>Small Orders: 5-10 minutes preparation.</li>
        <li>Large Orders: 20-30 minutes preparation.</li>
      </ul>

      <h4>7.3 Delivery Service</h4>
      <ul>
        <li>Optional delivery where available.</li>
        <li>Users must provide accurate addresses.</li>
        <li>Delivery times are estimates.</li>
      </ul>

      <h3>8. Intellectual Property Rights</h3>
      <p>
        All trademarks, content, designs, and software related to the Predine
        App are the property of Predine and protected under applicable
        intellectual property laws.
      </p>

      <h3>9. Third-Party Links and Services Disclaimer</h3>
      <p>
        The App may contain third-party services including payment gateways and
        analytics providers. Predine is not responsible for their content or
        policies.
      </p>

      <h3>10. Limitation of Liability</h3>

      <h4>10.1 Disclaimer</h4>
      <p>The App is provided on an "as is" and "as available" basis.</p>

      <h4>10.2 Exclusion of Damages</h4>
      <p>
        Predine shall not be liable for indirect damages, loss of profits,
        service interruptions, or food quality issues.
      </p>

      <h4>10.3 Maximum Liability</h4>
      <p>
        Predine's liability will not exceed the amount paid for the specific
        order.
      </p>

      <h3>11. Restaurant Partner Terms</h3>
      <ul>
        <li>Maintain accurate menu and pricing.</li>
        <li>Prepare confirmed orders on time.</li>
        <li>Comply with food safety regulations (FSSAI).</li>
        <li>Treat users and delivery staff professionally.</li>
      </ul>

      <h3>12. Termination Rights</h3>

      <h4>12.1 Termination by User</h4>
      <p>Accounts can be closed by contacting support@predine.in.</p>

      <h4>12.2 Termination by Predine</h4>
      <p>
        Accounts may be suspended for violations, fraud, abuse, or false
        information.
      </p>

      <h3>13. Privacy and Data Security</h3>
      <p>Use of the App is also governed by the Privacy Policy.</p>

      <h3>14. Environmental Commitment</h3>
      <p>
        Predine promotes sustainable dining and reduced food waste through
        advance ordering.
      </p>

      <h3>15. Governing Law and Jurisdiction</h3>
      <p>
        These Terms are governed by the laws of the Republic of India. Disputes
        fall under the jurisdiction of courts in Ghaziabad, Uttar Pradesh.
      </p>

      <h3>16. Modifications to Terms</h3>
      <p>
        Predine may update these Terms at any time and notify users via app,
        website, or email.
      </p>

      <h3>17. Contact Information</h3>
      <p>
        Email: <a href="mailto:support@predine.in">support@predine.in</a>
      </p>
      <p>Jurisdiction: Ghaziabad, Uttar Pradesh, India</p>

      <p>© 2026 Predine. All rights reserved.</p>
    </>
  );
}

export function TnCDialog() {
  return (
    <Dialog>
      <DialogTrigger className="underline cursor-pointer">Terms & Conditions</DialogTrigger>
      <DialogContent className="flex h-[85dvh] max-h-[85dvh] w-[min(92vw,42rem)] flex-col overflow-hidden p-0">
        <DialogTitle className="hidden">Terms & Conditions</DialogTitle>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-5">
          <div className="prose max-w-none wrap-break-word">
            <TermsAndConditionsContent />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
