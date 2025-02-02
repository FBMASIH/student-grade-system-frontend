"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
	const [user, setUser] = useState<any>(null);
	const router = useRouter();

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const { data } = await api.getCurrentUser();
				setUser(data);
				if (data.role === "student") router.push("/dashboard/student");
				if (data.role === "teacher") router.push("/dashboard/teacher");
				if (data.role === "admin") router.push("/dashboard/admin");
			} catch (err) {
				localStorage.removeItem("token");
				router.push("/login");
			}
		};
		fetchUser();
	}, []);

	return <p>در حال انتقال به داشبورد...</p>;
}
