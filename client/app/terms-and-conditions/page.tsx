import { TermsAndConditionsContent } from "@/components/policies/terms-and-conditions";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | Predine",
};

export default function PoliciesPage() {
  return (
    <main className="prose max-w-md mx-auto font-[inter] pt-8 px-4">
      <Button variant="ghost" asChild>
        <Link href="/" className="no-underline">
          <ChevronLeft />
          Home
        </Link>
      </Button>

      <TermsAndConditionsContent />
    </main>
  );
}
