"use client";

import { api } from "@/lib/api";
import { PaginatedResponse } from "@/lib/types/common";
import {
	Button,
	Card,
	CardBody,
	Chip,
	CircularProgress,
	Input,
	Pagination,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@nextui-org/react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";
import { AlertCircle, GraduationCap, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

interface Enrollment {
	id: number;
	student: { id: number; username: string } | null;
        group: {
                id: number;
                groupNumber: number;
                capacity: number;
                currentEnrollment: number;
                course: {
                        id: number;
                        name: string;
                        code: string;
                } | null;
                professor: { id: number; username: string } | null;
        } | null;
	score?: number;
	createdAt: string;
	isActive: boolean;
}

export default function EnrollmentsManagement() {
	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [selectedStudent, setSelectedStudent] = useState("");
	const [selectedGroup, setSelectedGroup] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		fetchEnrollments(page);
	}, [page]);

	const fetchEnrollments = async (currentPage: number) => {
		try {
			setIsLoading(true);
			const response = await api.getAllEnrollments(
				currentPage,
				10,
				searchQuery
			);
			const paginatedData = response.data as PaginatedResponse;

			setEnrollments(paginatedData.items);
			setTotalPages(paginatedData.meta.totalPages);
		} catch (err: any) {
			setError(err.message);
			setEnrollments([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = (value: string) => {
		setSearchQuery(value);
		setPage(1);
		fetchEnrollments(1);
	};

	const handleCreateEnrollment = async () => {
		if (!selectedStudent || !selectedGroup) return;

		try {
			await api.createEnrollment(
				parseInt(selectedStudent),
				parseInt(selectedGroup)
			);
			await fetchEnrollments(page); // Refresh data after creating
			setSelectedStudent("");
			setSelectedGroup("");
		} catch (err: any) {
			setError(err.message);
		}
	};

	const handleDeleteEnrollment = async (id: number) => {
		if (!confirm("آیا از حذف این ثبت‌نام اطمینان دارید؟")) return;

		try {
			await api.deleteEnrollment(id);
			await fetchEnrollments(page);
		} catch (err: any) {
			setError(err.message);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold">مدیریت ثبت‌نام‌ها</h2>
					<p className="text-neutral-600 dark:text-neutral-400">
						مدیریت ثبت‌نام دانشجویان در گروه‌های درسی
					</p>
				</div>
			</div>

			{/* New Enrollment Form */}
			<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
				<CardBody className="p-6">
					<div className="flex items-center gap-3 mb-6">
						<div className="p-2 rounded-lg bg-primary/10">
							<UserPlus className="w-5 h-5 text-primary" />
						</div>
						<h3 className="text-xl font-bold">ثبت‌نام جدید</h3>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Input
							label="شماره دانشجویی"
							placeholder="مثال: 400123456"
							value={selectedStudent}
							onChange={(e) => setSelectedStudent(e.target.value)}
						/>
						<Input
							label="کد گروه درسی"
							placeholder="مثال: 1234"
							value={selectedGroup}
							onChange={(e) => setSelectedGroup(e.target.value)}
						/>
					</div>

					<Button
						color="primary"
						className="w-full mt-6"
						onClick={handleCreateEnrollment}>
						ثبت‌نام دانشجو
					</Button>
				</CardBody>
			</Card>

			{/* Enrollments List */}
			<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
				<CardBody className="p-0">
					{isLoading ? (
						<div className="p-8 text-center">
							<CircularProgress color="primary" />
							<p className="mt-4 text-neutral-600">در حال بارگذاری...</p>
						</div>
					) : (
						<>
							<div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
								<Input
									placeholder="جستجو در ثبت‌نام‌ها..."
									value={searchQuery}
									onChange={(e) => handleSearch(e.target.value)}
									startContent={<Search className="w-4 h-4 text-neutral-500" />}
									className="w-full sm:w-72"
								/>
							</div>

							<Table aria-label="لیست ثبت‌نام‌ها">
								<TableHeader>
									<TableColumn>دانشجو</TableColumn>
									<TableColumn>درس و گروه</TableColumn>
									<TableColumn>استاد</TableColumn>
									<TableColumn>نمره</TableColumn>
									<TableColumn>تاریخ ثبت‌نام</TableColumn>
									<TableColumn>وضعیت</TableColumn>
									<TableColumn>عملیات</TableColumn>
								</TableHeader>
								<TableBody emptyContent="ثبت‌نامی یافت نشد">
									{enrollments.map((enrollment) => (
										<TableRow key={enrollment.id}>
											<TableCell>
												<div className="flex items-center gap-2">
													<GraduationCap className="w-4 h-4 text-neutral-500" />
													{enrollment.student?.username ?? "نامشخص"}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-col gap-1">
													<span>
														{enrollment.group?.course?.name ?? "نامشخص"}
													</span>
													<Chip size="sm" variant="flat">
														گروه {enrollment.group?.groupNumber ?? "نامشخص"}
													</Chip>
												</div>
											</TableCell>
											<TableCell>
												{enrollment.group?.professor?.username ?? "نامشخص"}
											</TableCell>
											<TableCell>{enrollment.score ?? "ثبت نشده"}</TableCell>
											<TableCell>
												{formatDistanceToNow(new Date(enrollment.createdAt), {
													addSuffix: true,
													locale: faIR,
												})}
											</TableCell>
											<TableCell>
												{enrollment.isActive ? (
													<Chip color="success" size="sm" variant="flat">
														فعال
													</Chip>
												) : (
													<Chip color="danger" size="sm" variant="flat">
														غیرفعال
													</Chip>
												)}
											</TableCell>
											<TableCell>
												<Button
													color="danger"
													variant="flat"
													size="sm"
													onClick={() => handleDeleteEnrollment(enrollment.id)}>
													حذف ثبت‌نام
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</>
					)}
				</CardBody>
			</Card>

			<div className="flex justify-center">
				<Pagination
					total={totalPages}
					initialPage={1}
					page={page}
					onChange={(page) => setPage(page)}
				/>
			</div>

			{error && (
				<div className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-4 rounded-xl shadow-lg flex items-center gap-3">
					<AlertCircle className="w-5 h-5" />
					<p>{error}</p>
				</div>
			)}
		</div>
	);
}
