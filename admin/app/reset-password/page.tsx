"use client";
import { useParams } from "next/navigation";
import VerifyEmailPage from "@/components/resetPass";
export default function VerifyEmail(){
const params = useParams<{id: string}>()
return (
    <VerifyEmailPage id={params.id}/>
)
}