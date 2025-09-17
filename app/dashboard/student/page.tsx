"use client";

import { TicketForm } from "@/components/TicketSystem/TicketForm"; // Import the TicketForm component
import { TicketList } from "@/components/TicketSystem/TicketList";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { StudentEnrollment } from "@/lib/types/enrollment";
import { StudentObjection } from "@/lib/types/objection";
import {
	Button,
	Card,
	CardBody,
	Chip,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Textarea,
	useDisclosure,
} from "@nextui-org/react";
import {
	AlertCircle,
	ArrowRight,
	Award,
	Book,
	Download,
	MessageSquare,
	School,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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

interface CourseWithGroups {
        id: number;
        name: string;
        code: string;
        subject: string;
        groups: Array<{
		id: number;
		groupNumber: number;
		currentEnrollment: number;
		courseId: number;
		professorId: number;
		isActive: boolean;
		enrollments: Array<{
			id: number;
			groupId: number;
			score: number | null;
			createdAt: string;
			isActive: boolean;
		}>;
	}>;
}

interface CourseEnrollment {
	id: number;
	groupId: number;
	score: number | null;
	createdAt: string;
	isActive: boolean;
}

interface FlattenedCourseData {
	courseId: number;
	courseName: string;
	courseCode: string;
	groupNumber: number;
	groupId: number;
	isActive: boolean;
	enrollmentId: number;
	score: number | null;
}

interface Objection {
	createdAt: string | number | Date;
	id: number;
	course: {
		id: number;
		name: string;
	};
	student: {
		id: number;
		name: string;
	};
	reason: string;
	resolved: boolean;
	response: string | null;
}

export default function StudentDashboard() {
        const token = useAuthStore((state) => state.token); // Get user from auth store
        const user = useAuthStore((state) => state.user);
        const hydrated = useAuthStore((state) => state.hydrated);
	const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
	const [courses, setCourses] = useState<CourseWithGroups[]>([]);
	const [error, setError] = useState("");
	const [selectedEnrollment, setSelectedEnrollment] = useState<{
		courseId: number;
		enrollmentId: number;
		courseName: string;
	} | null>(null);
	const [objectionReason, setObjectionReason] = useState("");
	const [isSubmittingObjection, setIsSubmittingObjection] = useState(false);
	const { isOpen, onOpen, onClose } = useDisclosure();
        const router = useRouter();
        const [mounted, setMounted] = useState(false);
        const [objections, setObjections] = useState<StudentObjection[]>([]);

        const loadStudentData = useCallback(async (studentId: number) => {
                try {
                        const [enrollmentsRes, coursesRes, objectionsRes] = await Promise.all([
                                api.getStudentEnrollments(studentId),
                                api.getStudentCourses(studentId),
                                api.getStudentObjections(studentId),
                        ]);

                        setEnrollments(enrollmentsRes.data.enrollments); // Set enrollments correctly

                        setCourses(coursesRes.data);
                        setObjections(objectionsRes.data || []); // Set as direct array
                } catch (err: any) {
                        if (err.response && err.response.status === 404) {
                                setEnrollments([]);
                                setCourses([]);
                                setObjections([]); // Reset to empty array on error
                        } else {
                                setError(err.message);
                                toast.error("خطا در دریافت اطلاعات دروس");
                        }
                }
        }, []);

        // Add mounting check
        useEffect(() => {
                setMounted(true);
        }, []);

        useEffect(() => {
                if (!mounted || !hydrated) return;

                if (!token || !user?.id) {
                        router.push("/login");
                        return;
                }
                loadStudentData(user.id);
        }, [token, user, router, mounted, hydrated, loadStudentData]);

	// Don't render anything until mounted
	if (!mounted) {
		return null;
	}

	const handleSubmitObjection = async () => {
		if (!selectedEnrollment || !objectionReason || !user?.id) return;

		setIsSubmittingObjection(true);
		try {
			const { data } = await api.submitObjection({
				courseId: selectedEnrollment.courseId,
				studentId: user.id,
				reason: objectionReason,
			});

			toast.success("اعتراض با موفقیت ثبت شد");
			onClose();
			setObjectionReason("");
			setSelectedEnrollment(null);

			// Update objections list with new objection
			const newObjection: StudentObjection = {
				...data,
				courseName: selectedEnrollment.courseName,
				status: "Pending",
				createdAt: new Date().toISOString(),
			};
			setObjections((prev) => [...prev, newObjection]);
		} catch (err: any) {
			toast.error(err.response?.data?.message || "خطا در ثبت اعتراض");
		} finally {
			setIsSubmittingObjection(false);
		}
	};

	const flattenCourseData = (
		courses: CourseWithGroups[]
	): FlattenedCourseData[] => {
		return courses.flatMap((course) =>
			course.groups.flatMap((group) =>
				group.enrollments.map((enrollment) => ({
					courseId: course.id,
					courseName: course.name,
					courseCode: course.code,
					groupNumber: group.groupNumber,
					groupId: group.id,
					isActive: group.isActive,
					enrollmentId: enrollment.id,
					score: enrollment.score,
				}))
			)
		);
	};

	const EmptyContent = () => (
		<div className="flex flex-col items-center justify-center py-8 text-neutral-600 dark:text-neutral-400">
			<Book className="w-12 h-12 mb-4 opacity-50" />
			<p className="text-lg font-medium">هیچ درسی ثبت نشده است</p>
			<p className="text-sm">در حال حاضر در هیچ درسی ثبت‌نام نکرده‌اید</p>
		</div>
	);

	const refreshData = () => {
		if (user?.id) {
			loadStudentData(user.id);
		}
	};

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-8">
			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="border border-neutral-200/50">
					<CardBody className="flex flex-row items-center gap-4">
						<div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
							<Book className="w-6 h-6 text-primary" />
						</div>
						<div>
							<p className="text-sm text-neutral-600">تعداد دروس</p>
							<p className="text-2xl font-bold">{courses.length}</p>
						</div>
					</CardBody>
				</Card>

				<Card className="border border-neutral-200/50">
					<CardBody className="flex flex-row items-center gap-4">
						<div className="p-3 bg-success-50 dark:bg-success-900/30 rounded-xl">
							<Award className="w-6 h-6 text-success" />
						</div>
						<div>
							<p className="text-sm text-neutral-600">معدل ترم</p>
							<p className="text-2xl font-bold">17.25</p>
						</div>
					</CardBody>
				</Card>

				{/* ...similar cards for other stats... */}
			</div>

			{/* Courses Table */}
			<Card className="border border-neutral-200/50">
				<CardBody>
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-2">
							<School className="w-5 h-5 text-primary" />
							<h3 className="text-xl font-bold">دروس ترم جاری</h3>
						</div>
						<Button
							color="primary"
							variant="flat"
							startContent={<Download className="w-4 h-4" />}>
							دانلود کارنامه
						</Button>
					</div>

					<Table removeWrapper aria-label="Course list">
						<TableHeader>
							<TableColumn>نام درس</TableColumn>
							<TableColumn>کد درس</TableColumn>
							<TableColumn>گروه</TableColumn>
							<TableColumn>نمره</TableColumn>
							<TableColumn>عملیات</TableColumn>
						</TableHeader>
						<TableBody emptyContent="هیچ درسی یافت نشد">
							{flattenCourseData(courses).map((item) => (
								<TableRow key={item.enrollmentId}>
									<TableCell className="font-medium">
										{item.courseName}
									</TableCell>
									<TableCell>
										<Chip size="sm" variant="flat">
											{item.courseCode}
										</Chip>
									</TableCell>
									<TableCell>
										<Chip
											variant="dot"
											color={item.isActive ? "success" : "default"}>
											گروه {item.groupNumber}
										</Chip>
									</TableCell>
									<TableCell>
										{item.score ? (
											<Chip
												size="sm"
												color={item.score >= 10 ? "success" : "danger"}
												variant="flat">
												{item.score}
											</Chip>
										) : (
											<Chip size="sm" variant="flat" color="warning">
												ثبت نشده
											</Chip>
										)}
									</TableCell>
									<TableCell>
										<Button
											size="sm"
											color="primary"
											variant="flat"
											isDisabled={!item.score}
											onClick={() => {
												setSelectedEnrollment({
													courseId: item.courseId,
													enrollmentId: item.enrollmentId,
													courseName: item.courseName,
												});
												onOpen();
											}}>
											ثبت اعتراض
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardBody>
			</Card>

			{/* Objection Modal */}
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalContent>
					<ModalHeader>
						<h3 className="text-lg font-bold">
							ثبت اعتراض به نمره {selectedEnrollment?.courseName}
						</h3>
					</ModalHeader>
					<ModalBody>
						<Textarea
							label="دلیل اعتراض"
							placeholder="لطفاً دلیل اعتراض خود را بنویسید..."
							value={objectionReason}
							onChange={(e) => setObjectionReason(e.target.value)}
							minRows={3}
							maxRows={5}
						/>
					</ModalBody>
					<ModalFooter>
						<Button color="danger" variant="light" onPress={onClose}>
							انصراف
						</Button>
						<Button
							color="primary"
							onPress={handleSubmitObjection}
							isLoading={isSubmittingObjection}
							isDisabled={!objectionReason.trim()}>
							ثبت اعتراض
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

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
								برای ارتباط با پشتیبانی و یا استاد راهنما می‌توانید از طریق فرم
								زیر تیکت ارسال کنید.
							</p>
						</div>
						<TicketForm onTicketCreated={refreshData} />
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

			{/* Objections Table */}
			<Card className="border border-neutral-200/50">
				<CardBody>
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-primary" />
							<h3 className="text-xl font-bold">اعتراضات</h3>
							<Chip size="sm" variant="flat">
								{objections?.length || 0} اعتراض
							</Chip>
						</div>
					</div>

					<Table removeWrapper aria-label="Objections list">
						<TableHeader>
							<TableColumn>نام درس</TableColumn>
							<TableColumn>دلیل اعتراض</TableColumn>
							<TableColumn>وضعیت</TableColumn>
							<TableColumn>تاریخ</TableColumn>
						</TableHeader>
						<TableBody emptyContent="اعتراضی یافت نشد">
							{(objections || []).map((objection) => (
								<TableRow key={objection.id}>
									<TableCell className="font-medium">
										{objection.courseName}
									</TableCell>
									<TableCell>{objection.reason}</TableCell>
									<TableCell>
										<div className="space-y-2">
											<Chip
												size="sm"
												variant="flat"
												color={objection.resolved ? "success" : "warning"}>
												{objection.status}
											</Chip>
											{objection.response && (
												<p className="text-sm text-neutral-600 mt-1">
													{objection.response}
												</p>
											)}
										</div>
									</TableCell>
									<TableCell>
										{new Date(objection.createdAt).toLocaleDateString("fa-IR")}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardBody>
			</Card>

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
