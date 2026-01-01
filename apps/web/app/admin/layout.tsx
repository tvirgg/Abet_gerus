"use client";
import { useAuth } from "@/shared/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace("/login");
            } else if (user.role !== "curator" && user.role !== "admin") {
                router.replace("/student/dashboard"); // or some other accessible page
            }
        }
    }, [user, loading, router]);

    if (loading) return <div className="p-10 flex justify-center">Loading...</div>;

    if (!user || (user.role !== "curator" && user.role !== "admin")) return null;

    return <div>{children}</div>;
}
