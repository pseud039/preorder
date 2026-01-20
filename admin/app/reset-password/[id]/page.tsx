"use client";
import { useParams } from "next/navigation";
import ResetPasswordPage from "@/components/resetPass";

export default function ResetPassword() {
  const params = useParams<{ id: string }>();
  return <ResetPasswordPage token={params.id} />;
}