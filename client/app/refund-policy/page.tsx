import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy | Predine",
};

export default function RefundPolicy() {
  return (
    <main className="prose max-w-md mx-auto font-[inter] pt-8 px-4 [&_table]:w-full [&_table]:border [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2">
      <Button variant="ghost" asChild>
        <Link href="/" className="no-underline">
          <ChevronLeft />
          Home
        </Link>
      </Button>

      <h2>Refund Policy</h2>

      <p>
        <strong>Effective Date:</strong> June 1, 2025
      </p>
      <p>
        <strong>Last Updated:</strong> June 1, 2025
      </p>
      <p>
        <strong>Jurisdiction:</strong> Ghaziabad, Uttar Pradesh, India
      </p>
      <p>
        <strong>Governed by:</strong> Consumer Protection Act 2019 & Allied
        Indian Laws
      </p>

      <h3>1. Overview & Legal Framework</h3>
      <p>
        This Refund Policy governs all refund and cancellation requests made by
        users of the Predine mobile application. It has been formulated in
        compliance with applicable Indian consumer protection and e-commerce
        laws.
      </p>

      <table>
        <tbody>
          <tr>
            <th>Statute</th>
            <th>Relevance to Refund Policy</th>
          </tr>
          <tr>
            <td>Consumer Protection Act, 2019</td>
            <td>
              Defines unfair trade practices and entitles consumers to refunds
              for deficient services.
            </td>
          </tr>
          <tr>
            <td>E-Commerce Rules, 2020</td>
            <td>
              Mandates disclosure of refund timelines and cancellation policies.
            </td>
          </tr>
          <tr>
            <td>Information Technology Act, 2000</td>
            <td>Governs digital transactions and electronic contracts.</td>
          </tr>
          <tr>
            <td>Indian Contract Act, 1872</td>
            <td>Provides the legal basis for binding contracts.</td>
          </tr>
          <tr>
            <td>Payment & Settlement Systems Act, 2007</td>
            <td>Governs digital payment systems.</td>
          </tr>
          <tr>
            <td>RBI Guidelines on Failed Transactions</td>
            <td>
              Mandates auto-reversal timelines for failed digital payments.
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        Under Section 2(11) of the Consumer Protection Act 2019, a consumer may
        seek remedies if services are found to be deficient. Predine's refund
        framework reflects these statutory rights while accounting for the
        perishable nature of food products.
      </p>

      <h3>2. General Refund Position — No Refund Policy</h3>

      <p>
        Predine operates a strict no-refund, no-cancellation policy once an
        order is confirmed and payment is processed.
      </p>

      <ul>
        <li>Food items are perishable and preparation begins immediately.</li>
        <li>
          Restaurant partners allocate ingredients and staff upon confirmation.
        </li>
        <li>
          Cancellation causes direct financial loss to restaurant partners.
        </li>
        <li>
          This policy aligns with Section 2(47) of the Consumer Protection Act
          2019.
        </li>
      </ul>

      <p>
        Users should carefully review order details before completing payment.
        Orders cannot be modified or cancelled once payment is confirmed.
      </p>

      <h3>3. Circumstances Where Refunds Apply</h3>

      <table>
        <tbody>
          <tr>
            <th>Circumstance</th>
            <th>Eligibility</th>
            <th>Refund Amount</th>
          </tr>

          <tr>
            <td>Technical platform failure resulting in non-fulfilment</td>
            <td>Eligible</td>
            <td>100% of order value</td>
          </tr>

          <tr>
            <td>Restaurant partner closure after order confirmation</td>
            <td>Eligible</td>
            <td>100% of order value</td>
          </tr>

          <tr>
            <td>Duplicate charge or erroneous billing</td>
            <td>Eligible</td>
            <td>Amount overcharged</td>
          </tr>

          <tr>
            <td>Payment debited but order not confirmed</td>
            <td>Eligible</td>
            <td>100% auto-reversed</td>
          </tr>

          <tr>
            <td>Order significantly different from description</td>
            <td>Case by Case</td>
            <td>Partial or full refund</td>
          </tr>

          <tr>
            <td>Food quality or safety complaint</td>
            <td>Case by Case</td>
            <td>Partial or full refund</td>
          </tr>

          <tr>
            <td>User cancellation after confirmation</td>
            <td>Not Eligible</td>
            <td>No refund</td>
          </tr>

          <tr>
            <td>Order not collected within pickup window</td>
            <td>Not Eligible</td>
            <td>No refund</td>
          </tr>

          <tr>
            <td>Failed delivery due to incorrect address</td>
            <td>Not Eligible</td>
            <td>No refund</td>
          </tr>

          <tr>
            <td>Change of mind after confirmation</td>
            <td>Not Eligible</td>
            <td>No refund</td>
          </tr>
        </tbody>
      </table>

      <h3>4. Failed & Erroneous Transactions</h3>

      <p>
        In accordance with RBI guidelines on failed digital transactions, the
        following auto-reversal timelines apply when payment is debited but the
        order is not confirmed.
      </p>

      <table>
        <tbody>
          <tr>
            <th>Payment Mode</th>
            <th>Auto-Reversal Timeline</th>
          </tr>

          <tr>
            <td>UPI</td>
            <td>Within 24 hours (T+1)</td>
          </tr>

          <tr>
            <td>Credit / Debit Card</td>
            <td>5-7 business days</td>
          </tr>

          <tr>
            <td>Net Banking</td>
            <td>5-7 business days</td>
          </tr>

          <tr>
            <td>Digital Wallet</td>
            <td>Within 24 hours (T+1)</td>
          </tr>
        </tbody>
      </table>

      <p>
        If your account is debited and no order confirmation is received within
        15 minutes, contact support@predine.in.
      </p>

      <h3>5. How to Submit a Refund Request</h3>

      <p>To submit a refund request:</p>

      <ol>
        <li>
          Email support@predine.in with subject "Refund Request — [Order ID]".
        </li>
        <li>Submit the request within 24 hours of the incident.</li>
        <li>
          Include Order ID, registered contact details, issue description, and
          supporting evidence.
        </li>
      </ol>

      <p>
        Predine may request additional evidence to verify claims. Fraudulent
        claims may result in account suspension or legal action.
      </p>

      <h3>6. Refund Processing Timelines</h3>

      <table>
        <tbody>
          <tr>
            <th>Payment Method</th>
            <th>Processing Timeline</th>
          </tr>

          <tr>
            <td>UPI</td>
            <td>2-3 business days</td>
          </tr>

          <tr>
            <td>Credit Card</td>
            <td>5-7 business days</td>
          </tr>

          <tr>
            <td>Debit Card</td>
            <td>5-7 business days</td>
          </tr>

          <tr>
            <td>Net Banking</td>
            <td>5-7 business days</td>
          </tr>

          <tr>
            <td>Digital Wallet</td>
            <td>2-3 business days</td>
          </tr>
        </tbody>
      </table>

      <p>
        Actual credit timing may vary depending on your bank or payment
        provider.
      </p>

      <h3>7. Consumer Grievance Redressal</h3>

      <p>
        If your refund request is not resolved within 15 business days, you may
        escalate:
      </p>

      <ul>
        <li>Grievance Officer: support@predine.in</li>
        <li>National Consumer Helpline: 1800-11-4000</li>
        <li>CONSUMER mobile application</li>
        <li>District Consumer Disputes Redressal Commission (DCDRC)</li>
        <li>State Consumer Commission</li>
        <li>National Consumer Commission</li>
      </ul>

      <h3>8. Chargebacks & Payment Disputes</h3>

      <p>
        If a user raises a chargeback without first contacting Predine support,
        Predine reserves the right to dispute the chargeback, suspend the
        account, or recover funds in cases of fraudulent claims.
      </p>

      <h3>9. Modifications to This Policy</h3>

      <p>
        Predine may update this Refund Policy at any time in accordance with
        changes in law. Users will be notified via app notification or email.
      </p>

      <h3>10. Governing Law & Jurisdiction</h3>

      <p>
        <strong>Jurisdiction:</strong> Ghaziabad, Uttar Pradesh
      </p>
      <p>
        <strong>Governing Law:</strong> Republic of India
      </p>

      <p>
        <strong>Refund Queries:</strong>{" "}
        <a href="mailto:support@predine.in">support@predine.in</a>
      </p>
      <p>
        <strong>Consumer Helpline:</strong> 1800-11-4000
      </p>

      <p>This Refund Policy forms part of Predine's Terms and Conditions.</p>

      <p>© 2025 Predine. All rights reserved.</p>
    </main>
  );
}
