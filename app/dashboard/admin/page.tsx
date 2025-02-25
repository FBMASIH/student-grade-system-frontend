"use client";

import {
	DashboardHeader,
	DashboardLayout,
} from "@/components/layouts/DashboardLayout";
import { TicketForm } from "@/components/TicketSystem/TicketForm";
import { TicketList } from "@/components/TicketSystem/TicketList";
import { TabsContainer } from "@/components/ui/TabsContainer";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { BookOpen, GraduationCap, TicketIcon, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuickStats } from "../../../components/QuickStats";
import { UsersManagement } from "../../../components/UsersManagement";
import CourseGroupsManagement from "./course-groups/page";
import CoursesManagement from "./courses/page";
import EnrollmentsManagement from "./enrollments/page";

export default function AdminDashboard() {
	const { token } = useAuthStore();
	const router = useRouter();
	const [selectedTab, setSelectedTab] = useState("users");
	const [initialData, setInitialData] = useState<{ users: any[] }>({
		users: [],
	});
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		if (!token) {
			router.push("/login");
			return;
		}

		try {
			setLoading(true);
			const response = await api.getUsers(1, 1000); // Get all users initially
			if (response.data && response.data.items) {
				setInitialData({ users: response.data.items });
			}
		} catch (error) {
			console.error("Failed to load users:", error);
		} finally {
			setLoading(false);
		}
	};

	// Only load initial data once
	useEffect(() => {
		loadData();
	}, [token]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
			</div>
		);
	}

	const tabs = [
		{
			key: "users",
			title: (
				<div className="flex items-center gap-2">
					<Users className="w-4 h-4" />
					<span>کاربران</span>
				</div>
			),
			content: (
				<UsersManagement
					initialData={initialData.users}
					onUserChange={loadData}
				/>
			),
		},
		{
			key: "courses",
			title: (
				<div className="flex items-center gap-2">
					<BookOpen className="w-4 h-4" />
					<span>دروس</span>
				</div>
			),
			content: <CoursesManagement />,
		},
		{
			key: "enrollments",
			title: (
				<div className="flex items-center gap-2">
					<GraduationCap className="w-4 h-4" />
					<span>ثبت‌نام‌ها</span>
				</div>
			),
			content: <EnrollmentsManagement />,
		},
		{
			key: "course-groups",
			title: (
				<div className="flex items-center gap-2">
					<Users className="w-4 h-4" />
					<span>گروه‌های درسی</span>
				</div>
			),
			content: <CourseGroupsManagement />,
		},
		{
			key: "tickets",
			title: (
				<div className="flex items-center gap-2">
					<TicketIcon className="w-4 h-4" />
					<span>تیکت‌ها</span>
				</div>
			),
			content: (
				<>
					<TicketForm onTicketCreated={loadData} />
					<TicketList />
				</>
			),
		},
	];

	return (
		<DashboardLayout>
			<DashboardHeader
				title="پنل مدیریت"
				description="مدیریت کاربران، دروس و ثبت‌نام‌ها"
			/>

			<QuickStats />

			<TabsContainer
				tabs={tabs}
				selectedTab={selectedTab}
				onChange={setSelectedTab}
			/>
		</DashboardLayout>
	);
}
