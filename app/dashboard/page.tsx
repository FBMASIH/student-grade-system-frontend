"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CircularProgress } from "@nextui-org/react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.getCurrentUser();
        if (data.role === "student") router.replace("/dashboard/student");
        if (data.role === "teacher") router.replace("/dashboard/teacher");
        if (data.role === "admin") router.replace("/dashboard/admin");
      } catch (err) {
        localStorage.removeItem("token");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center ">
      <div className="text-center space-y-4">
        {loading ? (
          <CircularProgress size="lg" color="primary" aria-label="Loading..." />
        ) : (
          <p className="text-lg font-bold text-neutral-600 dark:text-neutral-300">
            در حال انتقال به داشبورد...
          </p>
        )}
      </div>
    </div>
  );
}
