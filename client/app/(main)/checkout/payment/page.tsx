import PaymentPage from "@/components/paymentPage";
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const query = searchParams.orderId;
  return(
    <div className=""><PaymentPage query={query}/></div>
  )
}