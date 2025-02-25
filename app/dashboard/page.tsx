"use client";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { CircularProgress } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
	const setUser = useAuthStore((state) => state.setUser);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const { data } = await api.getCurrentUser();
				setUser({ id: data.id, role: data.role }); // Set the user in the store
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
	}, [router, setUser]);

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
