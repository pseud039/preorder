"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Main() {
    const router = useRouter();
    const pathname = usePathname();
    
    useEffect(() => {
        if (pathname === "/") {
            router.push("/login");
        }
    }, [pathname, router]);
    
    return null;
}
