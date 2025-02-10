"use client";

import { api } from "@/lib/api";
import { Card, CardBody } from "@nextui-org/react";
import { BookOpen, GraduationCap, School, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface QuickStatCardProps {
	icon: React.ReactNode;
	title: string;
	value: number | string;
	color: "primary" | "secondary" | "success" | "warning";
}

function QuickStatCard({ icon, title, value, color }: QuickStatCardProps) {
	const colorClasses = {
		primary: "bg-primary/10 text-primary",
		secondary: "bg-secondary/10 text-secondary",
		success: "bg-success/10 text-success",
		warning: "bg-warning/10 text-warning",
	};

	return (
		<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
			<CardBody className={`flex flex-row items-center gap-4`}>
				<div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
				<div>
					<p className="text-sm text-neutral-600 dark:text-neutral-400">
						{title}
					</p>
					<p className="text-2xl font-bold">{value}</p>
				</div>
			</CardBody>
		</Card>
	);
}

export function QuickStats() {
	const [stats, setStats] = useState({
		userCount: 0,
		courseCount: 0,
		enrollmentCount: 0,
		studentCount: 0,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const updateStats = useCallback((users: any[]) => {
		const studentCount = users.filter((user) => user.role === "student").length;

		setStats((prev) => ({
			...prev,
			userCount: users.length,
			studentCount,
		}));
	}, []);

	useEffect(() => {
		const handleUserChange = (event: CustomEvent) => {
			updateStats(event.detail.users);
		};

		window.addEventListener("usersUpdated", handleUserChange as EventListener);
		return () => {
			window.removeEventListener(
				"usersUpdated",
				handleUserChange as EventListener
			);
		};
	}, [updateStats]);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				setLoading(true);
				const [usersRes, coursesRes] = await Promise.all([
					api.getUsers(1, 1000), // Get all users
					api.getAllCourses(1, 1000), // Get all courses
				]);

				// Count students from users
				const studentCount =
					usersRes.data.users?.filter(
						(user: { role: string }) => user.role === "student"
					).length || 0;

				setStats({
					userCount: usersRes.data.users?.length || 0,
					courseCount: coursesRes.data?.length || 0,
					enrollmentCount: 0, // This will be implemented when we have the API
					studentCount,
				});
			} catch (err: any) {
				setError(err.message || "Failed to fetch stats");
				console.error("Stats error:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, []);

	if (loading) {
		return (
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{[...Array(4)].map((_, i) => (
					<Card
						key={i}
						className="border border-neutral-200/50 dark:border-neutral-800/50">
						<CardBody className="h-[88px] animate-pulse bg-neutral-100/50 dark:bg-neutral-800/50" />
					</Card>
				))}
			</div>
		);
	}

	if (error) {
		return <div>Error: {error}</div>;
	}

	return (
		<div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`}>
			<QuickStatCard
				icon={<Users className="w-5 h-5" />}
				title="کاربران"
				value={stats.userCount}
				color="primary"
			/>
			<QuickStatCard
				icon={<BookOpen className="w-5 h-5" />}
				title="دروس"
				value={stats.courseCount}
				color="success"
			/>
			<QuickStatCard
				icon={<School className="w-5 h-5" />}
				title="ثبت‌نام‌ها"
				value={stats.enrollmentCount}
				color="secondary"
			/>
			<QuickStatCard
				icon={<GraduationCap className="w-5 h-5" />}
				title="دانشجویان"
				value={stats.studentCount}
				color="warning"
			/>
		</div>
	);
}
