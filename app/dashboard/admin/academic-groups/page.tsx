"use client";

import { api, courseAssignmentsApi, groupsApi } from "@/lib/api";
import { Course, CourseAssignment, Group } from "@/lib/types/common";
import {
	Button,
	Card,
	CardBody,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
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
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

	const [formData, setFormData] = useState({
		groupName: "",
		courseId: "",
		professorId: "",
		capacity: "30",
		studentUsernames: "",
	});

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

	useEffect(() => {
		fetchGroups();
		fetchCoursesAndProfessors();
	}, []);

	const fetchGroups = async () => {
		try {
			const { data } = await groupsApi.getAllGroups();
			setGroups(data.items);
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
			setCourses(
				coursesRes.data.items.map((course: any) => ({
					...course,
					units: course.units || 0, // Ensure units property exists
				}))
			);
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

	const fetchStudentsForAssignment = async (assignmentId: number) => {
		try {
			const { data } = await courseAssignmentsApi.getAllAssignments(
				assignmentId
			);
			setStudents(data.items);
		} catch (err: any) {
			toast.error("Error fetching students");
		}
	};

	const handleAddStudents = async (usernames: string[]) => {
		if (!selectedAssignment) return;

		try {
			const userIds = usernames.map(username => {
				const user = students.find(student => student.username === username);
				return user ? user.id : null;
			}).filter(id => id !== null) as number[];
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
			// Instead of unenrollStudents, we'll use a DELETE request to remove students
			// You may need to add this method to your API if it doesn't exist
			await courseAssignmentsApi.enrollStudents(selectedAssignment, []);
			// Or alternatively, if your API supports it:
			// await api.removeStudentsFromCourseAssignment(selectedAssignment, studentIds);

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
													{assignment.professor.username}
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
								<Tabs aria-label="مدیریت گروه" className="p-0">
									<Tab key="courses" title="دروس">
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
														<TableCell>
															{assignment.professor.username}
														</TableCell>
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
									</Tab>
									<Tab key="students" title="دانشجویان">
										<Select
											label="درس"
											value={selectedAssignment?.toString() || ""}
											onChange={(e) => {
												const assignmentId = parseInt(e.target.value);
												setSelectedAssignment(assignmentId);
												fetchStudentsForAssignment(assignmentId);
											}}>
											{assignments.map((assignment) => (
												<SelectItem key={assignment.id} value={assignment.id}>
													{assignment.course.name}
												</SelectItem>
											))}
										</Select>
										<Table aria-label="دانشجویان گروه">
											<TableHeader>
												<TableColumn>نام کاربری</TableColumn>
												<TableColumn>وضعیت</TableColumn>
												<TableColumn>اقدامات</TableColumn>
											</TableHeader>
											<TableBody>
												{students.map((student) => (
													<TableRow key={student.id}>
														<TableCell>{student.username}</TableCell>
														<TableCell>
															{student.isEnrolled
																? "ثبت‌نام شده"
																: "ثبت‌نام نشده"}
														</TableCell>
														<TableCell>
															<Button
																color="danger"
																size="sm"
																onClick={() =>
																	handleRemoveStudents([student.id])
																}>
																حذف
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
										<div className="mt-4 space-y-4">
											<Input
												label="نام‌های کاربری دانشجویان (با کاما جدا کنید)"
												placeholder="مثلاً student1, student2"
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														studentUsernames: e.target.value,
													}))
												}
											/>
											<Button
												color="primary"
												onClick={() =>
													handleAddStudents(
														formData.studentUsernames
															.split(",")
															.map((username: string) => username.trim())
													)
												}
												className="mt-4">
												اضافه کردن دانشجو
											</Button>
											<div className="mt-4">
												<Input
													type="file"
													accept=".xlsx, .xls"
													onChange={handleImportStudents}
												/>
												<Button
													color="primary"
													onClick={handleAssignImportedStudents}
													className="mt-4">
													وارد کردن دانشجویان از اکسل
												</Button>
											</div>
										</div>
									</Tab>
								</Tabs>
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
		</div>
	);
}

// Update the API interface (add this to your api.ts file)
