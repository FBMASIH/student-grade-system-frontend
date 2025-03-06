"use client";

import { api } from "@/lib/api";
import { PaginatedResponse } from "@/lib/types/common";
import {
	Button,
	Card,
	CardBody,
	Checkbox,
	Chip,
	CircularProgress,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Pagination,
	Select,
	SelectItem,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	useDisclosure,
} from "@nextui-org/react";
import {
	AlertCircle,
	Copy,
	Plus,
	Search,
	Upload,
	UserPlus,
} from "lucide-react"; // Add Upload and Eye icons
import {
	AwaitedReactNode,
	JSXElementConstructor,
	ReactElement,
	ReactNode,
	ReactPortal,
	useEffect,
	useState,
} from "react";
import { toast } from "sonner"; // Add this import

interface CourseGroup {
	id: number;
	groupNumber: number;
	currentEnrollment: number;
	course: { id: number; name: string };
	professor: { id: number; username: string; role: string };
}

interface GroupStudentStatus {
	id: number;
	username: string;
	isEnrolled: boolean;
	canEnroll: boolean;
	enrollmentStatus: "enrolled" | "can_enroll" | "cannot_enroll";
}

interface GroupStatusResponse {
	groupInfo: {
		id: number;
		groupNumber: number;
		courseName: string;
		capacity: number;
		currentEnrollment: number;
	};
	students: GroupStudentStatus[];
}

// Add this interface
interface RegisteredUser {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
}

// Add this interface for API error response
interface ApiErrorResponse {
	message: string;
	error: string;
	statusCode: number;
}

// Add this interface
interface DuplicateUser {
	username: string;
	firstName: string;
	lastName: string;
	message: string;
}

// Update the interfaces to match exact API response
interface ExcelUploadResponse {
	users: RegisteredUser[];
	errors: string[];
	duplicates: DuplicateUser[];
	reactivated: RegisteredUser[];
}

interface BulkEnrollmentResponse {
	successful: Array<{ username: string }>;
	errors: Array<{ username: string; reason: string }>;
}

export default function CourseGroupsManagement() {
	const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [formData, setFormData] = useState({
		courseId: "",
		professorId: "",
	});
	const [courses, setCourses] = useState<Array<{ id: number; name: string }>>(
		[]
	);
	const [professors, setProfessors] = useState<
		{
			id: number;
			username: string;
		}[]
	>([]);
	const [students, setStudents] = useState<GroupStudentStatus[]>([]);
	const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
	const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
	const [selectedGroupInfo, setSelectedGroupInfo] = useState<
		GroupStatusResponse["groupInfo"] | null
	>(null);
	const [error, setError] = useState("");
	const { isOpen, onOpen, onClose } = useDisclosure();
	const {
		isOpen: isManageStudentsOpen,
		onOpen: onManageStudentsOpen,
		onClose: onManageStudentsClose,
	} = useDisclosure();
	const {
		isOpen: isUploadExcelOpen,
		onOpen: onUploadExcelOpen,
		onClose: onUploadExcelClose,
	} = useDisclosure();
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingForm, setIsLoadingForm] = useState(false);
	const [uploadedUsers, setUploadedUsers] = useState<
		Array<{ id: number; username: string }>
	>([]);
	const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [duplicateUsers, setDuplicateUsers] = useState<DuplicateUser[]>([]);
	const [uploadErrors, setUploadErrors] = useState<string[]>([]);

	useEffect(() => {
		fetchCourseGroups(page);
		fetchCoursesAndProfessors();
	}, [page]);

	const fetchCourseGroups = async (currentPage: number) => {
		try {
			setIsLoading(true);
			const { data } = await api.getAllCourseGroups(
				currentPage,
				10,
				searchQuery
			);
			const paginatedData = data as PaginatedResponse;

			// Add null check and default to empty array
			setCourseGroups(paginatedData?.items || []);
			setTotalPages(paginatedData?.meta?.totalPages || 1);
		} catch (err: any) {
			setError(err.message);
			setCourseGroups([]); // Reset to empty array on error
		} finally {
			setIsLoading(false);
		}
	};

	const fetchCoursesAndProfessors = async () => {
		try {
			setIsLoadingForm(true);
			const [coursesRes, usersRes] = await Promise.all([
				api.getAllCourses(1, 100),
				api.getUsers(1, 100, undefined, "teacher"),
			]);

			const coursesData = coursesRes.data as PaginatedResponse;
			const usersData = usersRes.data as PaginatedResponse;

			// Add null checks and default to empty array
			setCourses(coursesData?.items || []);
			setProfessors(usersData?.items || []);
		} catch (err: any) {
			setError(err.message);
			setCourses([]);
			setProfessors([]);
		} finally {
			setIsLoadingForm(false);
		}
	};

	const fetchStudents = async () => {
		try {
			const { data } = await api.getUsers(1, 100, undefined, "student");
			const usersData = data as PaginatedResponse;
			setStudents(usersData.items);
		} catch (err: any) {
			setError(err.message);
			setStudents([]);
		}
	};

	const fetchStudentsInGroup = async (groupId: number) => {
		try {
			const { data } = await api.getStudentsInGroup(groupId);
			setSelectedStudents(data.map((student) => student.id));
		} catch (err: any) {
			setError(err.message);
			setSelectedStudents([]);
		}
	};

	const handleSearch = (value: string) => {
		setSearchQuery(value);
		setPage(1);
		fetchCourseGroups(1);
	};

	const handleCreateGroup = async () => {
		try {
			await api.createCourseGroup({
				courseId: parseInt(formData.courseId),
				professorId: parseInt(formData.professorId),
			});
			onClose();
			fetchCourseGroups(page);
			setFormData({
				courseId: "",
				professorId: "",
			});
		} catch (err: any) {
			setError(err.message);
		}
	};

	const handleManageStudents = async (groupId: number) => {
		setSelectedGroupId(groupId);
		setIsLoadingForm(true);
		try {
			const { data } = await api.getGroupStudentsStatus(groupId);
			setStudents(data.students || []);
			setSelectedGroupInfo(data.groupInfo);
			setSelectedStudents(
				data.students
					.filter((student: { isEnrolled: any }) => student.isEnrolled)
					.map((student: { id: any }) => student.id)
			);
			onManageStudentsOpen();
		} catch (err: any) {
			setError(err.message);
			setStudents([]);
			setSelectedStudents([]);
		} finally {
			setIsLoadingForm(false);
		}
	};

	const handleAddStudentsToGroup = async () => {
		if (selectedGroupId === null) return;

		try {
			await api.addStudentsToGroup(selectedGroupId, selectedStudents);
			onManageStudentsClose();
			fetchCourseGroups(page);
			setSelectedStudents([]);
		} catch (err: any) {
			setError(err.message);
		}
	};

	const handleStudentSelection = (studentId: number) => {
		setSelectedStudents((prevSelected) =>
			prevSelected.includes(studentId)
				? prevSelected.filter((id) => id !== studentId)
				: [...prevSelected, studentId]
		);
	};

	const handleCopyId = (id: number) => {
		navigator.clipboard.writeText(id.toString());
	};

	// Update the handleFileChange function
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		setDuplicateUsers([]);
		setUploadErrors([]);

		const formData = new FormData();
		formData.append("file", file);

		try {
			const { data } = await api.uploadUsersExcel(formData);
			console.log("Upload response:", data);

			// Store all valid users (both new and reactivated)
			const validUsers = [...(data.users || []), ...(data.reactivated || [])];
			setRegisteredUsers(validUsers);

			// Store duplicates and errors
			setDuplicateUsers(data.duplicates || []);
			setUploadErrors(data.errors || []);

			// Show success messages
			if (data.users?.length > 0) {
				toast.success(`${data.users.length} کاربر جدید با موفقیت ثبت شد`);
			}
			if (data.reactivated?.length > 0) {
				toast.success(`${data.reactivated.length} کاربر مجدداً فعال شد`);
			}

			// Show duplicate warnings
			data.duplicates?.forEach(
				(d: { firstName: any; lastName: any; username: any; message: any }) => {
					toast.warning(
						`${d.firstName} ${d.lastName} (${d.username}): ${d.message}`
					);
				}
			);

			// Show errors
			data.errors?.forEach(
				(
					error:
						| string
						| number
						| bigint
						| boolean
						| (() => React.ReactNode)
						| ReactElement<any, string | JSXElementConstructor<any>>
						| Iterable<ReactNode>
						| ReactPortal
						| Promise<AwaitedReactNode>
						| null
						| undefined
				) => {
					toast.error(error);
				}
			);
		} catch (err: any) {
			console.error("Upload error:", err);
			toast.error(err.response?.data?.message || "خطا در آپلود فایل");
			setRegisteredUsers([]);
		} finally {
			setIsUploading(false);
		}
	};

	// Update the handleEnrollUploadedUsers function
	const handleEnrollUploadedUsers = async () => {
		if (!selectedGroupId) {
			toast.error("گروه انتخاب نشده است");
			return;
		}

		if (!registeredUsers || registeredUsers.length === 0) {
			toast.error("هیچ دانشجویی برای ثبت‌نام انتخاب نشده است");
			return;
		}

		try {
			const usernames = registeredUsers.map((user) => user.username);
			const { data } = await api.addStudentsToGroupByUsername(
				selectedGroupId,
				usernames
			);

			// Handle successful enrollments
			if (data.successful.length > 0) {
				toast.success(
					`${data.successful.length} دانشجو با موفقیت ثبت‌نام شدند`
				);
			}

			// Handle errors for specific students
			if (data.errors.length > 0) {
				data.errors.forEach(({ username, reason }) => {
					toast.error(`${username}: ${reason}`);
				});
			}

			// Refresh the course groups data
			await fetchCourseGroups(page);
			onUploadExcelClose();
			setRegisteredUsers([]);
		} catch (err: any) {
			const errorResponse = err.response?.data as ApiErrorResponse;
			toast.error(errorResponse?.message || "خطا در ثبت‌نام دانشجویان");
			console.error("Enrollment error:", errorResponse || err);
		}
	};

	// Add this new function before the return statement
	const handleDeleteCourseGroup = async (
		groupId: number,
		courseName: string,
		enrollmentCount: number
	) => {
		const confirmMessage = `آیا از حذف این گروه درسی اطمینان دارید؟\n\nهشدار: با حذف این گروه، تمامی ${enrollmentCount} ثبت‌نام موجود در آن نیز حذف خواهند شد.\n\nدرس: ${courseName}\nشماره گروه: ${groupId}`;

		if (confirm(confirmMessage)) {
			try {
				await api.deleteCourseGroup(groupId);
				toast.success("گروه درسی با موفقیت حذف شد");
				fetchCourseGroups(page);
			} catch (err: any) {
				toast.error(err.response?.data?.message || "خطا در حذف گروه درسی");
			}
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold">مدیریت گروه‌های درسی</h2>
					<p className="text-neutral-600 dark:text-neutral-400">
						{isLoading
							? "در حال بارگذاری..."
							: `${courseGroups?.length || 0} گروه درسی فعال در سیستم`}
					</p>
				</div>
				<Button
					color="primary"
					startContent={<Plus className="w-4 h-4" />}
					onPress={onOpen}>
					افزودن گروه جدید
				</Button>
			</div>

			<div className="flex gap-4 items-center">
				<Input
					placeholder="جستجو در گروه‌های درسی..."
					value={searchQuery}
					onChange={(e) => handleSearch(e.target.value)}
					startContent={<Search className="w-4 h-4 text-neutral-500" />}
					className="w-full max-w-xs"
				/>
			</div>

			<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
				<CardBody className="p-0">
					<Table aria-label="لیست گروه‌های درسی">
						<TableHeader>
							<TableColumn>شماره گروه</TableColumn>
							<TableColumn>درس</TableColumn>
							<TableColumn>ثبت‌نام فعلی</TableColumn>
							<TableColumn>استاد</TableColumn>
							<TableColumn>عملیات</TableColumn>
						</TableHeader>
						<TableBody emptyContent="گروهی یافت نشد">
							{(courseGroups || []).map((group) => (
								<TableRow key={group.id}>
									<TableCell>
										<Chip
											variant="flat"
											color="primary"
											className="cursor-pointer transition-all hover:opacity-80"
											onClick={() => handleCopyId(group.id)}
											endContent={<Copy className="w-3 h-3 ml-1" />}>
											{group.groupNumber} (#{group.id})
										</Chip>
									</TableCell>
									<TableCell>{group?.course?.name ?? "نامشخص"}</TableCell>
									<TableCell>{group?.currentEnrollment}</TableCell>
									<TableCell>
										{group?.professor?.username ?? "نامشخص"}
									</TableCell>
									<TableCell>
										<Button
											color="danger"
											variant="flat"
											size="sm"
											onClick={() =>
												handleDeleteCourseGroup(
													group.id,
													group?.course?.name ?? "نامشخص",
													group?.currentEnrollment ?? 0
												)
											}>
											حذف گروه
										</Button>
										<Button
											color="primary"
											variant="flat"
											size="sm"
											onClick={() => handleManageStudents(group.id)}>
											مدیریت دانشجویان
										</Button>
										<Button
											color="primary"
											variant="flat"
											size="sm"
											startContent={<Upload className="w-4 h-4" />}
											onClick={() => {
												setSelectedGroupId(group.id);
												onUploadExcelOpen();
											}}>
											افزودن با اکسل
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
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

			{/* Add Course Group Modal */}
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>افزودن گروه جدید</ModalHeader>
							<ModalBody className="gap-4">
								<Select
									label="درس"
									value={formData.courseId}
									onChange={(e) =>
										setFormData({ ...formData, courseId: e.target.value })
									}
									isLoading={isLoadingForm}>
									{Array.isArray(courses)
										? courses.map((course) => (
												<SelectItem key={course.id} value={course.id}>
													{course.name}
												</SelectItem>
										  ))
										: null}
								</Select>
								<Select
									label="استاد"
									value={formData.professorId}
									onChange={(e) =>
										setFormData({ ...formData, professorId: e.target.value })
									}
									isLoading={isLoadingForm}>
									{Array.isArray(professors)
										? professors.map((prof) => (
												<SelectItem key={prof.id} value={prof.id}>
													{prof.username}
												</SelectItem>
										  ))
										: null}
								</Select>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									انصراف
								</Button>
								<Button
									color="primary"
									onPress={handleCreateGroup}
									isLoading={isLoadingForm}
									isDisabled={
										isLoadingForm || !formData.courseId || !formData.professorId
									}>
									افزودن گروه
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Manage Students Modal */}
			<Modal
				isOpen={isManageStudentsOpen}
				onClose={onManageStudentsClose}
				size="2xl">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-bold">مدیریت دانشجویان گروه</h3>
									<Chip size="sm" variant="flat" color="primary">
										ظرفیت: {selectedGroupInfo?.currentEnrollment || 0}/
										{selectedGroupInfo?.capacity || 0}
									</Chip>
								</div>
								<span className="text-sm text-neutral-500">
									{selectedGroupInfo?.courseName}
								</span>
							</ModalHeader>
							<ModalBody>
								<div className="flex flex-col gap-4">
									<Input
										placeholder="جستجوی دانشجو..."
										startContent={<Search className="w-4 h-4" />}
									/>

									<Card>
										<CardBody className="p-0">
											<Table
												removeWrapper
												aria-label="لیست دانشجویان"
												classNames={{
													base: "max-h-[400px] overflow-auto",
												}}>
												<TableHeader>
													<TableColumn>انتخاب</TableColumn>
													<TableColumn>نام کاربری</TableColumn>
													<TableColumn>وضعیت</TableColumn>
												</TableHeader>
												<TableBody>
													{(students || []).map((student) => (
														<TableRow key={student.id}>
															<TableCell>
																<Checkbox
																	isSelected={selectedStudents.includes(
																		student.id
																	)}
																	onValueChange={() =>
																		handleStudentSelection(student.id)
																	}
																	isDisabled={
																		!student.canEnroll && !student.isEnrolled
																	}
																/>
															</TableCell>
															<TableCell>{student.username}</TableCell>
															<TableCell>
																{student.isEnrolled ? (
																	<Chip
																		color="success"
																		size="sm"
																		variant="flat">
																		عضو گروه
																	</Chip>
																) : student.canEnroll ? (
																	<Chip
																		color="primary"
																		size="sm"
																		variant="flat">
																		قابل افزودن
																	</Chip>
																) : (
																	<Chip color="danger" size="sm" variant="flat">
																		غیرقابل افزودن
																	</Chip>
																)}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</CardBody>
									</Card>

									<div className="flex justify بین items-center">
										<span className="text-sm text-neutral-500">
											{selectedStudents.length} دانشجو انتخاب شده
										</span>
									</div>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									انصراف
								</Button>
								<Button
									color="primary"
									onPress={handleAddStudentsToGroup}
									isLoading={isLoadingForm}
									isDisabled={isLoadingForm}>
									ذخیره تغییرات
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Upload Excel Modal */}
			<Modal isOpen={isUploadExcelOpen} onClose={onUploadExcelClose} size="4xl">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<h3 className="text-lg font-bold">
									افزودن دانشجویان از فایل اکسل
								</h3>
								<p className="text-sm text-neutral-500">
									فایل اکسل باید شامل ستون username باشد
								</p>
							</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<Card className="border border-neutral-200 dark:border-neutral-800">
										<CardBody className="p-4">
											<Input
												type="file"
												accept=".xlsx,.xls,.csv"
												onChange={handleFileChange}
												disabled={isUploading}
												description="فرمت‌های مجاز: Excel (.xlsx, .xls) و CSV"
												classNames={{
													input: "cursor-pointer",
												}}
											/>
										</CardBody>
									</Card>

									{isUploading && (
										<div className="flex flex-col items-center gap-2 py-8">
											<CircularProgress aria-label="Loading..." />
											<p className="text-sm text-neutral-600">
												در حال پردازش فایل...
											</p>
										</div>
									)}

									{/* Display Errors */}
									{uploadErrors.length > 0 && (
										<Card className="border-danger">
											<CardBody>
												<div className="flex items-center gap-2 mb-2">
													<AlertCircle className="w-5 h-5 text-danger" />
													<h4 className="font-medium text-danger">خطاها</h4>
												</div>
												<ul className="list-disc list-inside space-y-1">
													{uploadErrors.map((error, index) => (
														<li key={index} className="text-danger text-sm">
															{error}
														</li>
													))}
												</ul>
											</CardBody>
										</Card>
									)}

									{/* Display Duplicates */}
									{duplicateUsers.length > 0 && (
										<Card className="border-warning">
											<CardBody>
												<div className="flex items-center gap-2 mb-2">
													<AlertCircle className="w-5 h-5 text-warning" />
													<h4 className="font-medium text-warning">
														کاربران تکراری
													</h4>
												</div>
												<Table
													removeWrapper
													aria-label="لیست کاربران تکراری"
													classNames={{
														base: "max-h-[200px] overflow-auto",
													}}>
													<TableHeader>
														<TableColumn>نام کاربری</TableColumn>
														<TableColumn>نام</TableColumn>
														<TableColumn>نام خانوادگی</TableColumn>
														<TableColumn>پیام</TableColumn>
													</TableHeader>
													<TableBody>
														{duplicateUsers.map((user, index) => (
															<TableRow key={index}>
																<TableCell>{user.username}</TableCell>
																<TableCell>{user.firstName}</TableCell>
																<TableCell>{user.lastName}</TableCell>
																<TableCell>
																	<Chip
																		color="warning"
																		size="sm"
																		variant="flat">
																		{user.message}
																	</Chip>
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</CardBody>
										</Card>
									)}

									{/* Display Valid Users */}
									{registeredUsers.length > 0 && (
										<Card className="border border-neutral-200 dark:border-neutral-800">
											<CardBody className="p-0">
												<div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
													<div className="flex items-center justify-between">
														<p className="text-success-600 font-medium">
															{registeredUsers.length} دانشجو استخراج شده
														</p>
													</div>
												</div>
												<div className="max-h-[400px] overflow-auto">
													<Table
														removeWrapper
														aria-label="لیست دانشجویان"
														classNames={{
															base: "min-h-[200px]",
														}}>
														<TableHeader>
															<TableColumn>نام کاربری</TableColumn>
															<TableColumn>نام</TableColumn>
															<TableColumn>نام خانوادگی</TableColumn>
														</TableHeader>
														<TableBody>
															{registeredUsers.map((user) => (
																<TableRow key={user.username}>
																	<TableCell>{user.username}</TableCell>
																	<TableCell>{user.firstName}</TableCell>
																	<TableCell>{user.lastName}</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											</CardBody>
										</Card>
									)}
								</div>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									انصراف
								</Button>
								{registeredUsers.length > 0 && (
									<Button
										color="primary"
										onPress={handleEnrollUploadedUsers}
										isLoading={isUploading}
										startContent={<UserPlus className="w-4 h-4" />}>
										ثبت‌نام {registeredUsers.length} دانشجو در گروه
									</Button>
								)}
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
