"use client";
import { useParams } from "next/navigation";
import RestaurantDetailsPage from "@/components/superadmin/superadmin.restaurantDetails";

export default function RestaurantDetails() {
  const params = useParams<{ id: string }>();
  return <RestaurantDetailsPage id={params.id} />;
}
