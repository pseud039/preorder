"use client";
import ResetPasswordPage from '@/components/resetPasswordPage';
import { useParams } from "next/navigation";

export default function ResetPassword() {
  const params = useParams<{ token: string }>();
  return <ResetPasswordPage token={params.token} />;
}