import PaymentPage from "@/components/paymentPage";

interface SearchParams {
  orderId: string;
}

export default async function PaymentPageWrapper({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  
  return (
    <div>
      <PaymentPage/>
    </div>
  );
}