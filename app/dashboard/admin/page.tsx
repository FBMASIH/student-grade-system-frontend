"use client";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Card, CardBody, Tab, Tabs } from "@nextui-org/react";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuickStats } from "../../../components/QuickStats";
import { UsersManagement } from "../../../components/UsersManagement";
import CoursesManagement from "./courses/page";
import EnrollmentsManagement from "./enrollments/page";

export default function AdminDashboard() {
	const { token } = useAuthStore();
	const router = useRouter();
	const [selectedTab, setSelectedTab] = useState("users");
	const [initialData, setInitialData] = useState({ users: [] });
	const [loading, setLoading] = useState(true);

	// Load data when component mounts and token is available
	useEffect(() => {
		const loadData = async () => {
			if (!token) {
				router.push("/login");
				return;
			}

			try {
				setLoading(true);
				const response = await api.getUsers(1, 1000); // Get all users initially
				if (response.data && response.data.users) {
					setInitialData({ users: response.data.users });
				}
			} catch (error) {
				console.error("Failed to load users:", error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [token, router]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
			</div>
		);
	}

	return (
		<div
			className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800"
			dir="rtl">
			<div className="max-w-[1400px] mx-auto p-4 lg:p-6 xl:p-8 space-y-6">
				{/* Header */}
				<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
					<div className="space-y-1">
						<h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold">
							پنل مدیریت
						</h1>
						<p className="text-neutral-600 dark:text-neutral-400">
							مدیریت کاربران، دروس و ثبت‌نام‌ها
						</p>
					</div>
				</div>

				<QuickStats />

				{/* Main Content */}
				<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
					<CardBody className="p-0">
						<Tabs
							selectedKey={selectedTab}
							onSelectionChange={(key) => setSelectedTab(key.toString())}
							aria-label="مدیریت سیستم"
							className="p-0"
							classNames={{
								tabList: "p-0 bg-transparent",
								cursor: "bg-primary",
								tab: "h-12 px-8",
								panel: "p-4",
							}}>
							<Tab
								key="users"
								title={
									<div className="flex items-center gap-2">
										<Users className="w-4 h-4" />
										<span>کاربران</span>
									</div>
								}>
								<UsersManagement
									key={`users-${initialData.users.length}`}
									initialData={initialData.users}
								/>
							</Tab>

							<Tab
								key="courses"
								title={
									<div className="flex items-center gap-2">
										<BookOpen className="w-4 h-4" />
										<span>دروس</span>
									</div>
								}>
								<CoursesManagement />
							</Tab>

							<Tab
								key="enrollments"
								title={
									<div className="flex items-center gap-2">
										<GraduationCap className="w-4 h-4" />
										<span>ثبت‌نام‌ها</span>
									</div>
								}>
								<EnrollmentsManagement />
							</Tab>
						</Tabs>
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
