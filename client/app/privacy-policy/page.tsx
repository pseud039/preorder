import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Predine",
};

export default function PrivacyPolicy() {
  return (
    <main className="prose max-w-md mx-auto font-[inter] pt-8 px-4">
      <Button variant="ghost" asChild>
        <Link href="/" className="no-underline">
          <ChevronLeft />
          Home
        </Link>
      </Button>

      <h2 className="mt-8 text-center">Privacy Policy</h2>

      <p>
        <strong>Effective Date:</strong> June 1, 2025
      </p>
      <p>
        <strong>Last Updated:</strong> June 1, 2025
      </p>
      <p>
        <strong>Jurisdiction:</strong> Ghaziabad, Uttar Pradesh, India
      </p>

      <h3>1. Introduction and Scope</h3>
      <p>
        This Privacy Policy explains how Predine collects, uses, stores, and
        protects personal data obtained through the Predine mobile application.
      </p>

      <h3>2. Customer/User Information Collection</h3>

      <h4>2.1 Information You Provide</h4>
      <ul>
        <li>Full name, mobile number, email, and date of birth</li>
        <li>Profile photo and dietary preferences</li>
        <li>Order details and order history</li>
        <li>Delivery address and instructions</li>
        <li>Payment method information (last 4 digits only)</li>
        <li>Customer support messages and reviews</li>
      </ul>

      <h4>2.2 Information Collected Automatically</h4>
      <ul>
        <li>Device information</li>
        <li>Usage data</li>
        <li>Location data</li>
        <li>IP address and log data</li>
      </ul>

      <h4>2.3 Information from Third Parties</h4>
      <ul>
        <li>Payment gateway transaction status</li>
        <li>Analytics usage statistics</li>
      </ul>

      <h3>3. Use of Information</h3>

      <h4>Service Delivery</h4>
      <ul>
        <li>Account creation and management</li>
        <li>Order processing</li>
        <li>Payment processing</li>
        <li>Delivery coordination</li>
      </ul>

      <h4>Communication</h4>
      <ul>
        <li>Order confirmations</li>
        <li>Customer support responses</li>
        <li>Marketing communications (with consent)</li>
      </ul>

      <h4>Service Improvement</h4>
      <ul>
        <li>Usage analytics</li>
        <li>Product improvement</li>
        <li>Fraud detection</li>
      </ul>

      <h4>Legal Compliance</h4>
      <ul>
        <li>Compliance with Indian laws</li>
        <li>Responding to lawful requests</li>
      </ul>

      <h3>4. Third-Party Disclosure</h3>

      <h4>Restaurant Partners</h4>
      <p>Order information is shared to fulfil your order.</p>

      <h4>Payment Processors</h4>
      <p>Payment data is shared with payment gateway providers.</p>

      <h4>Delivery Partners</h4>
      <p>Name, address, and phone number may be shared for deliveries.</p>

      <h4>Service Providers</h4>
      <p>Hosting, analytics, and support services.</p>

      <h4>Legal Authorities</h4>
      <p>Data may be disclosed when required by law.</p>

      <h4>Business Transfers</h4>
      <p>Data may be transferred in the event of acquisition or merger.</p>

      <h3>5. Information Protection</h3>

      <h4>Technical Measures</h4>
      <ul>
        <li>SSL/TLS encryption</li>
        <li>AES-256 encryption at rest</li>
        <li>Secure APIs</li>
        <li>Security audits</li>
      </ul>

      <h4>Administrative Measures</h4>
      <ul>
        <li>Restricted data access</li>
        <li>Employee privacy training</li>
        <li>Incident response procedures</li>
      </ul>

      <h4>Data Retention</h4>
      <p>
        Data is retained while accounts remain active or as required by law.
      </p>

      <h4>Data Breach Notification</h4>
      <p>Users will be notified in accordance with the DPDP Act 2023.</p>

      <h3>6. Rights of Users</h3>

      <ul>
        <li>Right to access personal data</li>
        <li>Right to correction</li>
        <li>Right to erasure</li>
        <li>Right to grievance redressal</li>
        <li>Right to nominate</li>
        <li>Right to withdraw consent</li>
      </ul>

      <p>Requests can be sent to support@predine.in.</p>

      <h3>7. Cookies and Tracking Technologies</h3>

      <h4>Types Used</h4>
      <ul>
        <li>Authentication tokens</li>
        <li>Analytics SDKs</li>
        <li>Preference storage</li>
      </ul>

      <h4>Your Choices</h4>
      <p>Users may control tracking through device settings.</p>

      <h3>8. Children's Privacy</h3>
      <p>The App is not intended for individuals under 18.</p>

      <h3>9. Updates to This Privacy Policy</h3>
      <p>
        Predine may update this policy and notify users through the app or
        email.
      </p>

      <h3>10. Contact / Data Protection Officer</h3>

      <p>
        Email: <a href="mailto:support@predine.in">support@predine.in</a>
      </p>
      <p>Location: Ghaziabad, Uttar Pradesh, India</p>

      <p>© 2026 Predine. All rights reserved.</p>
    </main>
  );
}
