import OrderDetails from "@/components/orderDetails";

interface OrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  
  return <OrderDetails orderId={orderId} />;
}
