"use client";

import { FileUploader } from "@/components/file-uploader"; // Create this component if not exists
import { api, courseAssignmentsApi, groupsApi } from "@/lib/api";
import {
	Course,
	CourseAssignment,
	Group,
	Student,
	StudentWithEnrollment,
} from "@/lib/types/common";
import {
	Button,
	Card,
	CardBody,
	Chip,
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
import { Selection } from "@react-types/shared";
import { AlertCircle, Upload } from "lucide-react";
import {
	AwaitedReactNode,
	JSXElementConstructor,
	ReactElement,
	ReactNode,
	ReactPortal,
	useEffect,
	useState,
} from "react";
import { toast } from "sonner";

interface ExcelUploadResponse {
	users: Array<{
		id: number;
		username: string;
		firstName: string;
		lastName: string;
	}>;
	errors: string[];
	duplicates: Array<{
		username: string;
		firstName: string;
		lastName: string;
		message: string;
	}>;
}

export default function AcademicGroupsManagement() {
	const [groups, setGroups] = useState<Group[]>([]);
	const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
	const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
	const [courses, setCourses] = useState<Course[]>([]);
	const [professors, setProfessors] = useState<any[]>([]);
	const [students, setStudents] = useState<any[]>([]);
	const [importedStudents, setImportedStudents] = useState<any[]>([]);
	const [selectedAssignment, setSelectedAssignment] = useState<number | null>(
		null
	);
	const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
	const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(
		new Set()
	);
	const [isLoading, setIsLoading] = useState(false);
	const [allStudents, setAllStudents] = useState<StudentWithEnrollment[]>([]);
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
	const [isProcessing, setIsProcessing] = useState(false);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [importResults, setImportResults] = useState<{
		successful: { username: string }[];
		errors: { username: string; reason: string }[];
	} | null>(null);

	const [uploadedUsers, setUploadedUsers] = useState<
		ExcelUploadResponse["users"]
	>([]);
        const [uploadErrors, setUploadErrors] = useState<string[]>([]);
        const [duplicateUsers, setDuplicateUsers] = useState<
                ExcelUploadResponse["duplicates"]
        >([]);
        const [isUploading, setIsUploading] = useState(false);
        const [showUploadResults, setShowUploadResults] = useState(false);

        const [formData, setFormData] = useState({
                groupName: "",
                courseId: "",
                professorId: "",
                capacity: "30",
                studentUsernames: "",
        });

        const formatUserName = (
                user?: {
                        firstName?: string | null;
                        lastName?: string | null;
                        username?: string | null;
                } | null
        ) => {
                if (!user) return "نامشخص";
                const parts = [user.firstName, user.lastName]
                        .map((part) => part?.trim())
                        .filter(Boolean) as string[];
                if (parts.length > 0) {
                        return parts.join(" ");
                }
                return user.username ?? "نامشخص";
        };

	const {
		isOpen: isCreateGroupOpen,
		onOpen: onCreateGroupOpen,
		onClose: onCreateGroupClose,
	} = useDisclosure();
	const {
		isOpen: isManageGroupOpen,
		onOpen: onManageGroupOpen,
		onClose: onManageGroupClose,
	} = useDisclosure();
	const {
		isOpen: isManageStudentsOpen,
		onOpen: onManageStudentsOpen,
		onClose: onManageStudentsClose,
	} = useDisclosure();

	const [page, setPage] = useState(1);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [selectedCourses, setSelectedCourses] = useState<Set<number>>(
		new Set()
	);

	useEffect(() => {
		fetchGroups();
		fetchCoursesAndProfessors();
	}, []);

        const fetchGroups = async () => {
                try {
                        const { data } = await groupsApi.getAllGroups();
                        setGroups(data?.items ?? []);
                } catch (err: any) {
                        toast.error("Error fetching groups");
                }
        };

	const fetchCoursesAndProfessors = async () => {
		try {
			const [coursesRes, professorsRes] = await Promise.all([
				api.getAllCourses(1, 100),
				api.getUsers(1, 100, undefined, "teacher"),
			]);
                        setCourses(coursesRes.data.items);
			setProfessors(professorsRes.data.items);
		} catch (err: any) {
			toast.error("Error fetching courses and professors");
		}
	};

	const handleCreateGroup = async () => {
		try {
			await groupsApi.createGroup({ name: formData.groupName });
			toast.success("Group created successfully");
			fetchGroups();
			onCreateGroupClose();
			setFormData((prev) => ({ ...prev, groupName: "" }));
		} catch (err: any) {
			toast.error("Error creating group");
		}
	};

	const handleCreateAssignment = async () => {
		if (!selectedGroup) return;

		try {
			await courseAssignmentsApi.createAssignment({
				groupId: selectedGroup.id,
				courseId: parseInt(formData.courseId),
				professorId: parseInt(formData.professorId),
				capacity: parseInt(formData.capacity),
			});
			toast.success("Course assigned successfully");
			fetchAssignmentsForGroup(selectedGroup.id);
		} catch (err: any) {
			toast.error("Error assigning course");
		}
	};

	const handleRemoveAssignment = async (assignmentId: number) => {
		try {
			await courseAssignmentsApi.deleteAssignment(assignmentId);
			toast.success("Course removed successfully");
			if (selectedGroup) {
				fetchAssignmentsForGroup(selectedGroup.id);
			}
		} catch (err: any) {
			toast.error("Error removing course");
		}
	};

	const fetchAssignmentsForGroup = async (groupId: number) => {
		try {
			const { data } = await courseAssignmentsApi.getAllAssignments(groupId);
			const assignmentsWithDetails = await Promise.all(
				data.items.map(async (assignment: any) => {
					const course = courses.find((c) => c.id === assignment.courseId);
					const professor = professors.find(
						(p) => p.id === assignment.professorId
					);
					return {
						...assignment,
						course: course || { name: "Unknown" },
						professor: professor || { username: "Unknown" },
					};
				})
			);
			setAssignments(assignmentsWithDetails);
		} catch (err: any) {
			toast.error("Error fetching assignments");
		}
	};

	const fetchStudentsForAssignment = async (assignmentId: number, page = 1) => {
		try {
			setIsLoading(true);
			const { data } = await courseAssignmentsApi.getAllStudentsWithStatus(
				assignmentId,
				page,
				rowsPerPage
			);
			setAllStudents(data.students);
			setTotalPages(Math.ceil(data.total / rowsPerPage));
		} catch (err: any) {
			toast.error("Error fetching students");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearchStudents = async (query: string) => {
		if (!selectedAssignment) return;
		try {
			const { data } = await courseAssignmentsApi.searchStudents(
				selectedAssignment,
				query
			);
			setAvailableStudents(data.students);
		} catch (err) {
			toast.error("Error searching students");
		}
	};

	const handleBulkEnroll = async () => {
		if (!selectedAssignment) return;
		try {
			await courseAssignmentsApi.bulkEnrollStudents(
				selectedAssignment,
				Array.from(selectedStudentIds)
			);
			toast.success("Students enrolled successfully");
			fetchStudentsForAssignment(selectedAssignment);
			setSelectedStudentIds(new Set());
		} catch (err) {
			toast.error("Error enrolling students");
		}
	};

	const handleBulkUnenroll = async (studentIds: number[]) => {
		if (!selectedAssignment) return;
		try {
			await courseAssignmentsApi.bulkUnenrollStudents(
				selectedAssignment,
				studentIds
			);
			toast.success("Students removed successfully");
			fetchStudentsForAssignment(selectedAssignment);
		} catch (err: any) {
			toast.error("Error removing students");
		}
	};

	const handleAddStudents = async (usernames: string[]) => {
		if (!selectedAssignment) return;

		try {
			const userIds = usernames
				.map((username) => {
					const user = students.find(
						(student) => student.username === username
					);
					return user ? user.id : null;
				})
				.filter((id) => id !== null) as number[];
			await courseAssignmentsApi.enrollStudents(selectedAssignment, userIds);
			toast.success("Students added successfully");
			fetchStudentsForAssignment(selectedAssignment);
		} catch (err: any) {
			toast.error("Error adding students");
		}
	};

	const handleRemoveStudents = async (studentIds: number[]) => {
		if (!selectedAssignment) return;

		try {
			await courseAssignmentsApi.enrollStudents(selectedAssignment, []);
			toast.success("Students removed successfully");
			fetchStudentsForAssignment(selectedAssignment);
		} catch (err: any) {
			toast.error("Error removing students");
		}
	};

	const handleImportStudents = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("file", file);

		try {
			const { data } = await api.uploadUsersExcel(formData);
			setImportedStudents(data.students);
			toast.success("Students imported successfully");
		} catch (err: any) {
			toast.error("Error importing students");
		}
	};

	const handleAssignImportedStudents = async () => {
		if (!selectedAssignment) return;

		const usernames = importedStudents.map((student: any) => student.username);
		await handleAddStudents(usernames);
	};

	const fetchAvailableStudents = async (query: string = "") => {
		if (!selectedAssignment) return;
		try {
			const { data } = await courseAssignmentsApi.getAvailableStudents(
				selectedAssignment,
				query
			);
			setAvailableStudents(data.students);
		} catch (err: any) {
			toast.error("Error fetching available students");
		}
	};

	const handleSelectionChange = (keys: Selection) => {
		if (keys === "all") {
			setSelectedKeys(new Set(allStudents.map((s) => s.id.toString())));
		} else {
			setSelectedKeys(new Set(Array.from(keys, String)));
		}
	};

	const handleEnrollmentAction = async () => {
		if (
			!selectedGroup ||
			selectedKeys.size === 0 ||
			selectedCourses.size === 0
		) {
			toast.error("لطفا دانشجو و درس‌های مورد نظر را انتخاب کنید");
			return;
		}

		setIsProcessing(true);
		try {
			const enrollmentData = {
				studentIds: Array.from(selectedKeys).map(Number),
				courseIds: Array.from(selectedCourses),
				groupId: selectedGroup.id,
			};

			await courseAssignmentsApi.bulkEnrollInCourses(enrollmentData);
			toast.success("ثبت‌نام با موفقیت انجام شد");
			fetchStudentsForAssignment(page);
			setSelectedKeys(new Set());
			setSelectedCourses(new Set());
		} catch (err) {
			toast.error("خطا در ثبت‌نام دانشجویان");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleFileUpload = async (file: File) => {
		if (!selectedAssignment) return;

		const formData = new FormData();
		formData.append("file", file);

		setIsProcessing(true);
		try {
			const { data } = await api.uploadUsersExcel(formData);
			await courseAssignmentsApi.bulkEnrollStudents(
				selectedAssignment,
				data.students.map((s: any) => s.id)
			);
			toast.success("Students imported and enrolled successfully");
			fetchStudentsForAssignment(selectedAssignment);
		} catch (err) {
			toast.error("Error importing students");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleExcelImport = async (file: File) => {
		if (!selectedAssignment) return;

		setIsUploading(true);
		const formData = new FormData();
		formData.append("file", file);

		try {
			const { data } = await api.uploadUsersExcel(formData);
			setUploadedUsers(data.users || []);
			setUploadErrors(data.errors || []);
			setDuplicateUsers(data.duplicates || []);
			setShowUploadResults(true);

			if (data.users?.length > 0) {
				toast.success(`${data.users.length} دانشجو با موفقیت بارگذاری شد`);
			}

			data.duplicates?.forEach(
				(d: { firstName: any; lastName: any; username: any; message: any }) => {
					toast.warning(
						`${d.firstName} ${d.lastName} (${d.username}): ${d.message}`
					);
				}
			);

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
		} catch (err) {
			toast.error("خطا در بارگذاری فایل اکسل");
		} finally {
			setIsUploading(false);
		}
	};

	const handleEnrollUploadedUsers = async () => {
		if (!selectedAssignment || !uploadedUsers.length) return;

		setIsProcessing(true);
		try {
			await courseAssignmentsApi.bulkEnrollStudents(
				selectedAssignment,
				uploadedUsers.map((u) => u.id)
			);
			toast.success(`${uploadedUsers.length} دانشجو با موفقیت ثبت‌نام شدند`);
			fetchStudentsForAssignment(selectedAssignment);
			setShowUploadResults(false);
			setUploadedUsers([]);
		} catch (err) {
			toast.error("خطا در ثبت‌نام دانشجویان");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleCourseSelection = (courseId: number) => {
		const newSelected = new Set(selectedCourses);
		if (newSelected.has(courseId)) {
			newSelected.delete(courseId);
		} else {
			newSelected.add(courseId);
		}
		setSelectedCourses(newSelected);
	};

	const renderImportModal = () => (
		<Modal
			isOpen={isImportModalOpen}
			onClose={() => {
				setIsImportModalOpen(false);
				setImportResults(null);
			}}
			size="md">
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader>Import Students from Excel</ModalHeader>
						<ModalBody>
							{!importResults ? (
								<div className="flex flex-col gap-4 items-center">
									<p className="text-sm text-gray-500 text-center">
										Upload an Excel file containing student information. The
										file should have columns for username, firstName, and
										lastName.
									</p>
									<FileUploader
										onFileSelect={handleExcelImport}
										accept=".xlsx,.xls"
										isDisabled={isProcessing}
									/>
								</div>
							) : (
								<div className="space-y-4">
									{importResults.successful.length > 0 && (
										<Card>
											<CardBody>
												<h3 className="text-success mb-2">
													Successfully Added ({importResults.successful.length})
												</h3>
												<div className="max-h-32 overflow-y-auto">
													{importResults.successful.map((s, i) => (
														<div key={i} className="text-sm text-gray-600">
															{s.username}
														</div>
													))}
												</div>
											</CardBody>
										</Card>
									)}

									{importResults.errors.length > 0 && (
										<Card>
											<CardBody>
												<h3 className="text-danger mb-2">
													Failed to Add ({importResults.errors.length})
												</h3>
												<div className="max-h-32 overflow-y-auto">
													{importResults.errors.map((e, i) => (
														<div key={i} className="text-sm">
															<span className="text-gray-600">
																{e.username}
															</span>
															<span className="text-danger"> - {e.reason}</span>
														</div>
													))}
												</div>
											</CardBody>
										</Card>
									)}
								</div>
							)}
						</ModalBody>
						<ModalFooter>
							<Button color="danger" variant="light" onPress={onClose}>
								Close
							</Button>
							{importResults && (
								<Button
									color="primary"
									onPress={() => {
										setImportResults(null);
										onClose();
									}}>
									Done
								</Button>
							)}
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);

	const renderStudentManagementModal = () => (
		<Modal
			isOpen={isManageStudentsOpen}
			onClose={onManageStudentsClose}
			size="4xl"
			scrollBehavior="inside">
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							<h3 className="text-lg font-bold">مدیریت دانشجویان گروه</h3>
							<p className="text-sm text-neutral-500">{selectedGroup?.name}</p>
						</ModalHeader>
						<ModalBody>
							<div className="flex flex-col gap-4">
								{/* Course Selection Section */}
								<Card>
									<CardBody>
										<h4 className="text-md font-medium mb-2">انتخاب درس‌ها</h4>
										<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
											{assignments
												.filter((a) => a.groupId === selectedGroup?.id)
												.map((assignment) => (
													<Chip
														key={assignment.id}
														variant="flat"
														color={
															selectedCourses.has(assignment.id)
																? "primary"
																: "default"
														}
														className="cursor-pointer"
														onClick={() =>
															handleCourseSelection(assignment.id)
														}>
														{assignment.course.name}
													</Chip>
												))}
										</div>
									</CardBody>
								</Card>

								{/* Student List Section */}
								<div className="flex items-center justify-between mb-4">
                                                                        <Input
                                                                                placeholder="جستجوی دانشجو..."
                                                                                value={searchQuery}
                                                                                onChange={(e) => {
                                                                                        setSearchQuery(e.target.value);
                                                                                        handleSearchStudents(e.target.value);
                                                                                }}
                                                                                className="w-1/3"
                                                                                aria-label="جستجوی دانشجو"
                                                                        />
									<div>
                                                                                <input
                                                                                        type="file"
                                                                                        id="excel-upload"
                                                                                        accept=".xlsx,.xls"
                                                                                        onChange={(e) => handleExcelImport(e.target.files?.[0]!)}
                                                                                        className="hidden"
                                                                                        aria-label="بارگذاری فایل اکسل دانشجویان"
                                                                        />
										<Button
											color="primary"
											variant="flat"
											size="sm"
											startContent={<Upload className="w-4 h-4" />}
											onClick={() =>
												document.getElementById("excel-upload")?.click()
											}
											isDisabled={isProcessing}>
											افزودن با اکسل
										</Button>
									</div>
								</div>

								<Card>
									<CardBody className="p-0">
										<Table
											aria-label="لیست دانشجویان"
											selectionMode="multiple"
											selectedKeys={selectedKeys}
											onSelectionChange={handleSelectionChange}
											bottomContent={
												<div className="flex w-full justify-center">
                                                                                                       <Pagination
                                                                                                               isCompact
                                                                                                               showControls
                                                                                                               showShadow
                                                                                                               color="primary"
                                                                                                               page={page}
                                                                                                               total={totalPages}
                                                                                                               onChange={(page) => {
                                                                                                                       setPage(page);
                                                                                                                       fetchStudentsForAssignment(
                                                                                                                               selectedAssignment!,
                                                                                                                               page
                                                                                                                       );
                                                                                                               }}
                                                                                                               aria-label="صفحه‌بندی دانشجویان"
                                                                                                       />
												</div>
											}>
                                                                                        <TableHeader>
                                                                                                <TableColumn>نام دانشجو</TableColumn>
                                                                                                <TableColumn>درس‌های ثبت‌نام شده</TableColumn>
                                                                                        </TableHeader>
											<TableBody
												loadingState={isLoading ? "loading" : "idle"}
												emptyContent="دانشجویی یافت نشد">
												{allStudents.map((student) => (
													<TableRow key={student.id}>
                                                                                                                <TableCell>
                                                                                                                        <div className="flex flex-col">
                                                                                                                                <span>{formatUserName(student)}</span>
                                                                                                                                {student.username ? (
                                                                                                                                        <span className="text-xs text-neutral-500">{student.username}</span>
                                                                                                                                ) : null}
                                                                                                                        </div>
                                                                                                                </TableCell>
                                                                                                                <TableCell>
                                                                                                                        <div className="flex gap-1 flex-wrap">
                                                                                                                               <Chip
																	key={student.enrollmentId ?? student.id}
																	size="sm"
																	variant="flat"
																	color={student.isEnrolled ? "success" : "default"}>
																	{student.isEnrolled ? "ثبت‌نام شده" : "ثبت‌نام نشده"}
																</Chip>
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</CardBody>
								</Card>
							</div>
						</ModalBody>
						<ModalFooter>
							<div className="flex items-center gap-4 w-full">
								<span className="text-sm text-neutral-500">
									{Array.from(selectedKeys).length} دانشجو و{" "}
									{selectedCourses.size} درس انتخاب شده
								</span>
								<div className="flex gap-2 mr-auto">
									<Button color="danger" variant="light" onPress={onClose}>
										بستن
									</Button>
									<Button
										color="primary"
										onClick={handleEnrollmentAction}
										isLoading={isProcessing}
										isDisabled={
											selectedKeys.size === 0 || selectedCourses.size === 0
										}>
										ثبت‌نام دانشجویان
									</Button>
								</div>
							</div>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);

	const renderUploadResultsModal = () => (
		<Modal
			isOpen={showUploadResults}
			onClose={() => setShowUploadResults(false)}
			size="4xl">
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							<h3 className="text-lg font-bold">نتیجه بارگذاری فایل اکسل</h3>
						</ModalHeader>
						<ModalBody>
							<div className="space-y-4">
								{/* نمایش خطاها */}
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

								{/* نمایش موارد تکراری */}
								{duplicateUsers.length > 0 && (
									<Card className="border-warning">
										<CardBody>
											<div className="flex items-center gap-2 mb-2">
												<AlertCircle className="w-5 h-5 text-warning" />
												<h4 className="font-medium text-warning">
													موارد تکراری
												</h4>
											</div>
											<Table removeWrapper aria-label="لیست موارد تکراری">
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
																<Chip color="warning" size="sm" variant="flat">
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

								{/* نمایش کاربران موفق */}
								{uploadedUsers.length > 0 && (
									<Card>
										<CardBody>
											<div className="flex items-center justify-between mb-2">
												<h4 className="font-medium text-success">
													{uploadedUsers.length} دانشجو آماده ثبت‌نام
												</h4>
											</div>
											<Table removeWrapper aria-label="لیست دانشجویان">
												<TableHeader>
													<TableColumn>نام کاربری</TableColumn>
													<TableColumn>نام</TableColumn>
													<TableColumn>نام خانوادگی</TableColumn>
												</TableHeader>
												<TableBody>
													{uploadedUsers.map((user) => (
														<TableRow key={user.id}>
															<TableCell>{user.username}</TableCell>
															<TableCell>{user.firstName}</TableCell>
															<TableCell>{user.lastName}</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</CardBody>
									</Card>
								)}
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color="danger" variant="light" onPress={onClose}>
								انصراف
							</Button>
							{uploadedUsers.length > 0 && (
								<Button
									color="primary"
									onPress={handleEnrollUploadedUsers}
									isLoading={isProcessing}
									startContent={<Upload className="w-4 h-4" />}>
									ثبت‌نام {uploadedUsers.length} دانشجو در درس
								</Button>
							)}
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">مدیریت گروه‌های آموزشی</h1>
				<Button color="primary" onPress={onCreateGroupOpen}>
					ایجاد گروه جدید
				</Button>
			</div>

			<Card>
				<CardBody>
					<Table aria-label="گروه‌های آموزشی">
						<TableHeader>
							<TableColumn>نام گروه</TableColumn>
							<TableColumn>درس‌ها</TableColumn>
							<TableColumn>اساتید</TableColumn>
							<TableColumn>اقدامات</TableColumn>
						</TableHeader>
						<TableBody>
							{groups.map((group) => (
								<TableRow key={group.id}>
									<TableCell>{group.name}</TableCell>
									<TableCell>
										{assignments
											.filter((assignment) => assignment.groupId === group.id)
											.map((assignment) => (
												<div key={assignment.id}>{assignment.course.name}</div>
											))}
									</TableCell>
									<TableCell>
										{assignments
											.filter((assignment) => assignment.groupId === group.id)
                                                                                        .map((assignment) => (
                                                                                                <div key={assignment.id}>
                                                                                                        {formatUserName(assignment.professor)}
                                                                                                </div>
                                                                                        ))}
									</TableCell>
									<TableCell>
										<Button
											color="primary"
											size="sm"
											onClick={() => {
												setSelectedGroup(group);
												fetchAssignmentsForGroup(group.id);
												onManageGroupOpen();
											}}>
											مدیریت گروه
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardBody>
			</Card>

			{/* Create Group Modal */}
			<Modal isOpen={isCreateGroupOpen} onClose={onCreateGroupClose}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>ایجاد گروه آموزشی جدید</ModalHeader>
							<ModalBody>
								<Input
									label="نام گروه"
									placeholder="مثلاً FIATA-1"
									value={formData.groupName}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											groupName: e.target.value,
										}))
									}
								/>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									لغو
								</Button>
								<Button color="primary" onPress={handleCreateGroup}>
									ایجاد
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Manage Group Modal */}
			<Modal isOpen={isManageGroupOpen} onClose={onManageGroupClose} size="lg">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>مدیریت گروه {selectedGroup?.name}</ModalHeader>
							<ModalBody>
								<Table aria-label="دروس گروه">
									<TableHeader>
										<TableColumn>نام درس</TableColumn>
										<TableColumn>استاد</TableColumn>
										<TableColumn>ظرفیت</TableColumn>
										<TableColumn>اقدامات</TableColumn>
									</TableHeader>
									<TableBody>
										{assignments.map((assignment) => (
											<TableRow key={assignment.id}>
												<TableCell>{assignment.course.name}</TableCell>
                                                                                            <TableCell>{formatUserName(assignment.professor)}</TableCell>
												<TableCell>{assignment.capacity}</TableCell>
												<TableCell>
													<Button
														color="danger"
														size="sm"
														onClick={() =>
															handleRemoveAssignment(assignment.id)
														}>
														حذف
													</Button>
													<Button
														color="primary"
														size="sm"
														onClick={() => {
															setSelectedAssignment(assignment.id);
															fetchStudentsForAssignment(assignment.id);
															onManageStudentsOpen();
														}}>
														مدیریت دانشجویان
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
								<div className="mt-4 space-y-4">
									<Select
										label="درس"
										value={formData.courseId}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												courseId: e.target.value,
											}))
										}>
										{courses.map((course) => (
											<SelectItem key={course.id} value={course.id}>
												{course.name}
											</SelectItem>
										))}
									</Select>
									<Select
										label="استاد"
										value={formData.professorId}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												professorId: e.target.value,
											}))
										}>
										{professors.map((prof) => (
											<SelectItem key={prof.id} value={prof.id}>
												{prof.username}
											</SelectItem>
										))}
									</Select>
									<Input
										type="number"
										label="ظرفیت"
										value={formData.capacity}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												capacity: e.target.value,
											}))
										}
									/>
									<Button
										color="primary"
										onClick={handleCreateAssignment}
										className="mt-4">
										اضافه کردن درس
									</Button>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									لغو
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Manage Students Modal */}
			{renderStudentManagementModal()}
			{renderImportModal()}
			{renderUploadResultsModal()}
		</div>
	);
}
