import PaymentPage from "@/components/paymentPage";

interface SearchParams {
  orderId: string;
}

export default async function PaymentPageWrapper({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Await the searchParams promise in Next.js 15
  const params = await searchParams;
  
  return (
    <div>
      <PaymentPage query={params} />
    </div>
  );
}