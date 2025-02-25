"use client";

import {
	DashboardHeader,
	DashboardLayout,
} from "@/components/layouts/DashboardLayout";
import { api } from "@/lib/api";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tabs,
	useDisclosure,
} from "@nextui-org/react";
import {
	AlertCircle,
	BookOpen,
	Download,
	FileCheck,
	Search,
	Upload,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Student {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	score?: number;
}

interface CourseGroup {
	id: number;
	groupNumber: number;
	enrollmentCount: number;
	students: Student[];
}

interface Course {
	id: number;
	name: string;
	code: string;
	units: number;
	groups: CourseGroup[];
}

interface Objection {
	id: number;
	studentName: string;
	studentId: string;
	courseName: string;
	groupNumber: number;
	currentScore: number;
	requestedScore: number;
	reason: string;
	status: "pending" | "approved" | "rejected";
	createdAt: string;
}

export default function TeacherDashboard() {
	const [courses, setCourses] = useState<Course[]>([]);
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
	const [selectedGroup, setSelectedGroup] = useState<CourseGroup | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [searchQuery, setSearchQuery] = useState("");
	const [studentScores, setStudentScores] = useState<Record<number, number>>(
		{}
	);
	const [objections, setObjections] = useState<Objection[]>([]);
	const [selectedTab, setSelectedTab] = useState("courses");
	const {
		isOpen: isObjectionOpen,
		onOpen: onObjectionOpen,
		onClose: onObjectionClose,
	} = useDisclosure();
	const [selectedObjection, setSelectedObjection] = useState<Objection | null>(
		null
	);
	const [response, setResponse] = useState("");

	useEffect(() => {
		fetchTeacherCourses();
		fetchObjections();
	}, []);

	const fetchTeacherCourses = async () => {
		try {
			setIsLoading(true);
			const { data } = await api.getProfessorCourses(1); // Replace with new detailed API
			setCourses(data.courses);
		} catch (err: any) {
			setError(err.message);
			toast.error("خطا در دریافت اطلاعات دروس");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchObjections = async () => {
		try {
			const { data } = await api.getTeacherObjections(1); // Replace with actual teacher ID
			setObjections(data);
		} catch (err: any) {
			toast.error("خطا در دریافت اعتراضات");
		}
	};

	const handleGroupSelect = (course: Course, group: CourseGroup) => {
		setSelectedCourse(course);
		setSelectedGroup(group);
		// Initialize scores from existing data
		const scores: Record<number, number> = {};
		group.students.forEach((student) => {
			if (student.score !== undefined) {
				scores[student.id] = student.score;
			}
		});
		setStudentScores(scores);
		onOpen();
	};

	const handleScoreChange = (studentId: number, score: string) => {
		const numberScore = Number(score);
		if (numberScore >= 0 && numberScore <= 20) {
			setStudentScores((prev) => ({
				...prev,
				[studentId]: numberScore,
			}));
		}
	};

	const handleSubmitScores = async () => {
		if (!selectedGroup) return;

		try {
			const scores = Object.entries(studentScores).map(
				([studentId, score]) => ({
					studentId: Number(studentId),
					score,
				})
			);

			await Promise.all(
				scores.map(({ studentId, score }) =>
					api.updateEnrollmentGrade(studentId, score)
				)
			);
			toast.success("نمرات با موفقیت ثبت شدند");
			onClose();
			fetchTeacherCourses(); // Refresh data
		} catch (err: any) {
			toast.error("خطا در ثبت نمرات");
		}
	};

	const handleObjectionResponse = async () => {
		if (!selectedObjection || !response) return;

		try {
			await api.respondToObjection(selectedObjection.id, response);
			toast.success("پاسخ با موفقیت ثبت شد");
			onObjectionClose();
			fetchObjections();
			setResponse("");
		} catch (err: any) {
			toast.error("خطا در ثبت پاسخ");
		}
	};

	return (
		<DashboardLayout>
			<DashboardHeader
				title="پنل استاد"
				description="مدیریت دروس و نمرات دانشجویان">
				<div className="flex gap-3">
					<Chip
						startContent={<BookOpen className="w-4 h-4" />}
						variant="flat"
						color="primary"
						size="lg">
						{Array.isArray(courses) ? `${courses.length} درس فعال` : "بدون درس"}
					</Chip>
				</div>
			</DashboardHeader>

			<Tabs
				selectedKey={selectedTab}
				onSelectionChange={(key) => setSelectedTab(key.toString())}
				className="p-0"
				classNames={{
					tabList:
						"p-4 bg-neutral-50/50 dark:bg-neutral-800/50 border-b border-neutral-200/50 dark:border-neutral-800/50",
					cursor: "bg-primary",
					tab: "h-12 px-8",
					panel: "p-6",
					base: "border border-neutral-200/50 dark:border-neutral-800/50 rounded-large",
				}}>
				<Tab
					key="courses"
					title={
						<div className="flex items-center gap-2">
							<BookOpen className="w-4 h-4" />
							<span>دروس من</span>
						</div>
					}>
					{/* Existing courses content */}
					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
							<CardBody className="flex flex-row items-center gap-4">
								<div className="p-3 rounded-xl bg-primary/10">
									<Users className="w-6 h-6 text-primary" />
								</div>
								<div>
									<p className="text-sm text-neutral-600">تعداد دانشجویان</p>
									<p className="text-2xl font-bold">
										{Array.isArray(courses)
											? courses.reduce(
													(acc, course) =>
														acc +
														course.groups.reduce(
															(sum, group) => sum + group.enrollmentCount,
															0
														),
													0
											  )
											: 0}
									</p>
								</div>
							</CardBody>
						</Card>

						{/* Add more stat cards as needed */}
					</div>

					{/* Courses Table */}
					<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
						<CardHeader className="flex flex-col gap-3 px-6">
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-bold">لیست دروس</h2>
								<Input
									placeholder="جستجو..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									startContent={<Search className="w-4 h-4 text-neutral-500" />}
									className="w-64"
								/>
							</div>
						</CardHeader>
						<CardBody className="p-0">
							{!Array.isArray(courses) || courses.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 px-4">
									<BookOpen className="w-12 h-12 text-neutral-400 mb-4" />
									<p className="text-xl font-medium text-neutral-600 dark:text-neutral-400">
										هیچ درسی برای شما ثبت نشده است
									</p>
									<p className="text-sm text-neutral-500 mt-2">
										درس‌های شما پس از تخصیص توسط مدیر سیستم در این قسمت نمایش
										داده خواهند شد
									</p>
								</div>
							) : (
								<Table aria-label="لیست دروس">
									<TableHeader>
										<TableColumn>نام درس</TableColumn>
										<TableColumn>کد درس</TableColumn>
										<TableColumn>تعداد واحد</TableColumn>
										<TableColumn>گروه‌ها</TableColumn>
										<TableColumn>عملیات</TableColumn>
									</TableHeader>
									<TableBody>
										{courses.map((course) => (
											<TableRow key={course.id}>
												<TableCell>
													<div className="font-medium">{course.name}</div>
												</TableCell>
												<TableCell>
													<Chip size="sm" variant="flat">
														{course.code}
													</Chip>
												</TableCell>
												<TableCell>{course.units} واحد</TableCell>
												<TableCell>
													<div className="flex gap-2">
														{course.groups.map((group) => (
															<Chip
																key={group.id}
																size="sm"
																color="primary"
																variant="flat">
																گروه {group.groupNumber} (
																{group.enrollmentCount})
															</Chip>
														))}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex gap-2">
														{course.groups.map((group) => (
															<Button
																key={group.id}
																size="sm"
																color="primary"
																variant="flat"
																startContent={<FileCheck className="w-4 h-4" />}
																onClick={() =>
																	handleGroupSelect(course, group)
																}>
																ثبت نمرات گروه {group.groupNumber}
															</Button>
														))}
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardBody>
					</Card>
				</Tab>

				<Tab
					key="objections"
					title={
						<div className="flex items-center gap-2">
							<AlertCircle className="w-4 h-4" />
							<span>اعتراضات</span>
							{objections.filter((o) => o.status === "pending").length > 0 && (
								<Chip color="danger" size="sm">
									{objections.filter((o) => o.status === "pending").length}
								</Chip>
							)}
						</div>
					}>
					<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
						<CardHeader>
							<h3 className="text-lg font-bold">لیست اعتراضات</h3>
						</CardHeader>
						<CardBody>
							<Table aria-label="لیست اعتراضات">
								<TableHeader>
									<TableColumn>دانشجو</TableColumn>
									<TableColumn>درس</TableColumn>
									<TableColumn>نمره فعلی</TableColumn>
									<TableColumn>نمره درخواستی</TableColumn>
									<TableColumn>وضعیت</TableColumn>
									<TableColumn>تاریخ ثبت</TableColumn>
									<TableColumn>عملیات</TableColumn>
								</TableHeader>
								<TableBody>
									{objections.map((objection) => (
										<TableRow key={objection.id}>
											<TableCell>
												<div className="flex flex-col">
													<span className="font-medium">
														{objection.studentName}
													</span>
													<span className="text-sm text-neutral-500">
														{objection.studentId}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span>{objection.courseName}</span>
													<Chip size="sm" variant="flat">
														گروه {objection.groupNumber}
													</Chip>
												</div>
											</TableCell>
											<TableCell>{objection.currentScore}</TableCell>
											<TableCell>{objection.requestedScore}</TableCell>
											<TableCell>
												<Chip
													color={
														objection.status === "pending"
															? "warning"
															: objection.status === "approved"
															? "success"
															: "danger"
													}
													variant="flat">
													{objection.status === "pending"
														? "در انتظار بررسی"
														: objection.status === "approved"
														? "تایید شده"
														: "رد شده"}
												</Chip>
											</TableCell>
											<TableCell>
												{new Date(objection.createdAt).toLocaleDateString(
													"fa-IR"
												)}
											</TableCell>
											<TableCell>
												<Button
													size="sm"
													color="primary"
													variant="flat"
													isDisabled={objection.status !== "pending"}
													onClick={() => {
														setSelectedObjection(objection);
														onObjectionOpen();
													}}>
													پاسخ
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardBody>
					</Card>
				</Tab>
			</Tabs>

			{/* Objection Response Modal */}
			<Modal isOpen={isObjectionOpen} onClose={onObjectionClose}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>
								<h3 className="text-lg font-bold">پاسخ به اعتراض</h3>
							</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
										<p className="font-medium">متن اعتراض:</p>
										<p className="mt-2 text-neutral-600 dark:text-neutral-400">
											{selectedObjection?.reason}
										</p>
									</div>
									<Input
										label="پاسخ شما"
										placeholder="پاسخ خود را وارد کنید..."
										value={response}
										onChange={(e) => setResponse(e.target.value)}
										type="text"
									/>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									انصراف
								</Button>
								<Button
									color="primary"
									onPress={handleObjectionResponse}
									isDisabled={!response.trim()}>
									ثبت پاسخ
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Score Management Modal */}
			<Modal
				size="4xl"
				isOpen={isOpen}
				onClose={onClose}
				classNames={{
					base: "border border-neutral-200/50 dark:border-neutral-800/50",
					header: "border-b border-neutral-200/50 dark:border-neutral-800/50",
					body: "py-6",
					footer: "border-t border-neutral-200/50 dark:border-neutral-800/50",
				}}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<h3 className="text-lg font-bold">
									ثبت نمرات - {selectedCourse?.name}
								</h3>
								<p className="text-sm text-neutral-500">
									گروه {selectedGroup?.groupNumber} -{" "}
									{selectedGroup?.enrollmentCount} دانشجو
								</p>
							</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<div className="flex justify-end gap-2">
										<Button
											size="sm"
											color="primary"
											variant="flat"
											startContent={<Download className="w-4 h-4" />}>
											دریافت فایل اکسل
										</Button>
										<Button
											size="sm"
											color="primary"
											variant="flat"
											startContent={<Upload className="w-4 h-4" />}>
											بارگذاری فایل اکسل
										</Button>
									</div>

									<Table aria-label="لیست دانشجویان">
										<TableHeader>
											<TableColumn>شماره دانشجویی</TableColumn>
											<TableColumn>نام و نام خانوادگی</TableColumn>
											<TableColumn>نمره</TableColumn>
											<TableColumn>وضعیت</TableColumn>
										</TableHeader>
										<TableBody>
											{selectedGroup?.students?.map((student) => (
												<TableRow key={student.id}>
													<TableCell>{student.username}</TableCell>
													<TableCell>
														{student.firstName} {student.lastName}
													</TableCell>
													<TableCell>
														<Input
															type="number"
															min="0"
															max="20"
															step="0.25"
															value={
																studentScores[student.id]?.toString() || ""
															}
															onChange={(e) =>
																handleScoreChange(student.id, e.target.value)
															}
															className="w-24"
														/>
													</TableCell>
													<TableCell>
														<Chip
															size="sm"
															color={
																studentScores[student.id]
																	? "success"
																	: "warning"
															}
															variant="flat">
															{studentScores[student.id]
																? "ثبت شده"
																: "در انتظار ثبت"}
														</Chip>
													</TableCell>
												</TableRow>
											)) || []}
										</TableBody>
									</Table>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									انصراف
								</Button>
								<Button
									color="primary"
									onPress={handleSubmitScores}
									startContent={<FileCheck className="w-4 h-4" />}>
									ثبت نمرات
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</DashboardLayout>
	);
}
