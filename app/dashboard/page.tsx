"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CircularProgress, Box, Typography } from "@mui/material";

export default function Dashboard() {
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
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
			} finally {
				setLoading(false);
			}
		};
		fetchUser();
	}, []);

	return (
		<Box display="flex" justifyContent="center" alignItems="center" height="100vh" className="p-4 bg-gradient-to-b from-primary to-secondary">
			{loading ? (
				<CircularProgress />
			) : (
				<Typography variant="h6" className="text-white">در حال انتقال به داشبورد...</Typography>
			)}
		</Box>
	);
}
