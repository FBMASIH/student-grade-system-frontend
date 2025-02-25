"use client";

import { TicketForm } from "@/components/TicketSystem/TicketForm"; // Import the TicketForm component
import { TicketList } from "@/components/TicketSystem/TicketList";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import {
	Button,
	Card,
	CardBody,
	Chip,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@nextui-org/react";
import {
	AlertCircle,
	ArrowRight,
	Book,
	Download,
	MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Enrollment {
	id: number;
	group: {
		id: number;
		name: string;
		course: { name: string };
		professor: { name: string };
	};
	score?: number;
}

export default function StudentDashboard() {
	const { token } = useAuthStore();
	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [courses, setCourses] = useState([]);
	const [error, setError] = useState("");
	const router = useRouter();

	useEffect(() => {
		if (!token) {
			router.push("/login");
			return;
		}
		loadStudentData();
	}, [token, router]);

	const loadStudentData = async () => {
		try {
			const [enrollmentsRes, coursesRes] = await Promise.all([
				api.getStudentEnrollments(1), // Replace with actual student ID
				api.getStudentCourses(1), // Replace with actual student ID
			]);

			setEnrollments(enrollmentsRes.data);
			setCourses(coursesRes.data);
		} catch (err: any) {
			if (err.response && err.response.status === 404) {
				setEnrollments([]);
				setCourses([]);
			} else {
				setError(err.message);
			}
		}
	};

	const EmptyContent = () => (
		<div className="flex flex-col items-center justify-center py-8 text-neutral-600 dark:text-neutral-400">
			<Book className="w-12 h-12 mb-4 opacity-50" />
			<p className="text-lg font-medium">هیچ درسی ثبت نشده است</p>
			<p className="text-sm">در حال حاضر در هیچ درسی ثبت‌نام نکرده‌اید</p>
		</div>
	);

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-8">
			{/* Dashboard Header */}
			<div className="relative">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/20 dark:to-primary-800/10 p-6 rounded-2xl border border-primary-200/50 dark:border-primary-800/50">
					<div>
						<h2 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
							داشبورد دانشجو
						</h2>
						<p className="text-neutral-600 dark:text-neutral-400">خوش آمدید!</p>
					</div>
					<Button
						color="primary"
						className="backdrop-blur-sm"
						startContent={<Download className="w-4 h-4" />}>
						دانلود کارنامه
					</Button>
				</div>
			</div>

			{/* Main Grid Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Courses Section */}
				<div className="lg:col-span-2 space-y-6">
					<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
						<CardBody>
							<div className="flex items-center gap-2 mb-6">
								<Book className="w-5 h-5 text-primary" />
								<h3 className="text-xl font-bold">دروس ترم جاری</h3>
							</div>
							{enrollments.length === 0 ? (
								<EmptyContent />
							) : (
								<Table
									aria-label="دوره‌های دانشجو"
									classNames={{
										wrapper: "shadow-none",
										th: "bg-neutral-50 dark:bg-neutral-900",
										td: "py-3",
									}}>
									<TableHeader>
										<TableColumn>درس</TableColumn>
										<TableColumn>استاد</TableColumn>
										<TableColumn>نمره</TableColumn>
									</TableHeader>
									<TableBody>
										{enrollments.map((enrollment) => (
											<TableRow key={enrollment.id}>
												<TableCell className="font-medium">
													{enrollment.group.course.name}
												</TableCell>
												<TableCell>{enrollment.group.professor.name}</TableCell>
												<TableCell>
													<Chip
														color={enrollment.score ? "success" : "warning"}
														variant="flat"
														size="sm">
														{enrollment.score ?? "ثبت نشده"}
													</Chip>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardBody>
					</Card>
				</div>

				{/* Ticket Section */}
				<div className="space-y-6">
					<Card className="border border-neutral-200/50 dark:border-neutral-800/50 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900">
						<CardBody>
							<div className="flex items-center gap-2 mb-4">
								<MessageSquare className="w-5 h-5 text-primary" />
								<h3 className="text-xl font-bold">تیکت پشتیبانی</h3>
							</div>
							<div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mb-4 backdrop-blur-sm">
								<p className="text-sm text-neutral-600 dark:text-neutral-400">
									برای ارتباط با پشتیبانی و یا استاد راهنما می‌توانید از طریق
									فرم زیر تیکت ارسال کنید.
								</p>
							</div>
							<TicketForm onTicketCreated={loadStudentData} />
						</CardBody>
					</Card>

					<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
						<CardBody>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-bold">تیکت‌های اخیر</h3>
								<Button
									size="sm"
									variant="light"
									color="primary"
									onClick={() => router.push("/dashboard/tickets")}
									endContent={<ArrowRight className="w-4 h-4" />}>
									مشاهده همه
								</Button>
							</div>
							<TicketList limit={5} showPagination={false} />
						</CardBody>
					</Card>
				</div>
			</div>

			{/* Error Toast */}
			{error && (
				<div className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-4 rounded-xl shadow-lg flex items-center gap-3 backdrop-blur-sm">
					<AlertCircle className="w-5 h-5" />
					<p>{error}</p>
				</div>
			)}
		</div>
	);
}
