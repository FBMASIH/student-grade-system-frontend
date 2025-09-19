"use client";

import { api, courseGroupsApi } from "@/lib/api";
import { PaginatedResponse } from "@/lib/types/common";
import {
        Button,
        Card,
        CardBody,
        Checkbox,
        Chip,
        CircularProgress,
        Divider,
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
        Textarea,
        useDisclosure,
} from "@nextui-org/react";
import {
        AlertCircle,
        Copy,
        Plus,
        Search,
        Upload,
        UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface CourseGroup {
        id: number;
        groupNumber: number;
        currentEnrollment: number;
        course: { id: number; name: string };
        professor: {
                id: number;
                username: string;
                role: string;
                firstName?: string;
                lastName?: string;
        };
}

type EnrollmentStatus = "enrolled" | "can_enroll" | "cannot_enroll";

interface GroupStudentBase {
        id: number;
        username: string;
        firstName?: string;
        lastName?: string;
        isEnrolled: boolean;
        canEnroll: boolean;
}

interface GroupStudentStatus extends GroupStudentBase {
        enrollmentStatus: EnrollmentStatus;
}

interface RawGroupStudent {
        id: number;
        username: string;
        firstName?: string | null;
        lastName?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        isEnrolled?: boolean | null;
        canEnroll?: boolean | null;
        is_enrolled?: boolean | null;
        can_enroll?: boolean | null;
}

interface RawGroupInfo {
        id: number;
        groupNumber?: number | null;
        group_number?: number | null;
        courseName?: string | null;
        course_name?: string | null;
        capacity?: number | null;
        currentEnrollment?: number | null;
        current_enrollment?: number | null;
}

interface GroupStatusResponse {
        groupInfo?: RawGroupInfo | null;
        students?: RawGroupStudent[];
        enrolled?: RawGroupStudent[];
        enrolledStudents?: RawGroupStudent[];
        available?: RawGroupStudent[];
        availableStudents?: RawGroupStudent[];
}

const normalizeGroupStudent = (
        student: RawGroupStudent,
        overrides?: { isEnrolled?: boolean; canEnroll?: boolean }
): GroupStudentStatus => {
        const rawFirstName = student.firstName ?? student.first_name ?? "";
        const rawLastName = student.lastName ?? student.last_name ?? "";

        const firstName = typeof rawFirstName === "string" ? rawFirstName.trim() : "";
        const lastName = typeof rawLastName === "string" ? rawLastName.trim() : "";

        const isEnrolled =
                typeof overrides?.isEnrolled === "boolean"
                        ? overrides.isEnrolled
                        : typeof student.isEnrolled === "boolean"
                        ? student.isEnrolled
                        : typeof student.is_enrolled === "boolean"
                        ? student.is_enrolled
                        : false;

        const canEnroll =
                typeof overrides?.canEnroll === "boolean"
                        ? overrides.canEnroll
                        : typeof student.canEnroll === "boolean"
                        ? student.canEnroll
                        : typeof student.can_enroll === "boolean"
                        ? student.can_enroll
                        : false;

        return {
                id: student.id,
                username: student.username,
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                isEnrolled,
                canEnroll,
                enrollmentStatus: isEnrolled
                        ? "enrolled"
                        : canEnroll
                        ? "can_enroll"
                        : "cannot_enroll",
        };
};

const normalizeGroupInfo = (info?: RawGroupInfo | null): GroupInfo | null => {
        if (!info) {
                return null;
        }

        const resolveNumber = (value: unknown, fallback = 0) =>
                typeof value === "number" && Number.isFinite(value) ? value : fallback;

        const resolveString = (value: unknown) =>
                typeof value === "string" ? value.trim() : value != null ? String(value) : "";

        return {
                id: info.id,
                groupNumber: resolveNumber(info.groupNumber ?? info.group_number),
                courseName: resolveString(info.courseName ?? info.course_name),
                capacity: resolveNumber(info.capacity ?? info.currentEnrollment ?? info.current_enrollment, 0),
                currentEnrollment: resolveNumber(
                        info.currentEnrollment ?? info.current_enrollment
                ),
        };
};

const mergeStudentsById = (
        base: GroupStudentStatus[],
        additions: GroupStudentStatus[]
): GroupStudentStatus[] => {
        const map = new Map<number, GroupStudentStatus>();
        base.forEach((student) => map.set(student.id, student));
        additions.forEach((student) => map.set(student.id, student));
        return Array.from(map.values());
};

interface RegisteredUser {
        id: number;
        username: string;
        firstName: string;
        lastName: string;
}

interface ApiErrorResponse {
	message: string;
	error: string;
	statusCode: number;
}

interface DuplicateUser {
	username: string;
	firstName: string;
	lastName: string;
	message: string;
}

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

interface GroupStudent {
        id: number;
        username: string;
        firstName: string;
        lastName: string;
        isEnrolled: boolean;
        canEnroll: boolean;
}

interface GroupInfo {
	id: number;
	groupNumber: number;
	courseName: string;
	capacity: number;
	currentEnrollment: number;
}

interface Course {
	id: number;
	name: string;
}

interface Professor {
        id: number;
        username: string;
        firstName?: string;
        lastName?: string;
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
	const [courses, setCourses] = useState<Array<Course>>([]);
	const [professors, setProfessors] = useState<Array<Professor>>([]);
        const [enrolledStudents, setEnrolledStudents] = useState<GroupStudentStatus[]>([]);
        const [availableStudents, setAvailableStudents] = useState<GroupStudentStatus[]>([]);
        const [selectedForAddition, setSelectedForAddition] = useState<number[]>([]);
        const [selectedForRemoval, setSelectedForRemoval] = useState<number[]>([]);
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
        const [role, setRole] = useState("student");
        const [selectedFile, setSelectedFile] = useState<File | null>(null);
        const [enrolledSearch, setEnrolledSearch] = useState("");
        const [availableSearch, setAvailableSearch] = useState("");
        const [bulkUsernames, setBulkUsernames] = useState("");
        const [isStudentsLoading, setIsStudentsLoading] = useState(false);
        const [isSearchingAvailable, setIsSearchingAvailable] = useState(false);

        const fetchCourseGroups = useCallback(async (currentPage: number) => {
                try {
                        setIsLoading(true);
                        const { data } = await courseGroupsApi.getAllGroups(
                                currentPage,
                                10,
                                searchQuery
                        );
                        setCourseGroups(data?.items || []);
                        setTotalPages(data?.meta?.totalPages || 1);
                } catch (err: any) {
                        toast.error(err.response?.data?.message || "خطا در دریافت گروه‌ها");
                } finally {
                        setIsLoading(false);
                }
        }, [searchQuery]);

        const fetchCoursesAndProfessors = useCallback(async () => {
                try {
                        setIsLoadingForm(true);
                        const [coursesRes, usersRes] = await Promise.all([
                                api.getAllCourses(1, 100),
                                api.getUsers(1, 100, undefined, "teacher"),
			]);

			const coursesData = coursesRes.data as PaginatedResponse<Course>;
			const usersData = usersRes.data as PaginatedResponse<Professor>;

			setCourses(coursesData?.items || []);
			setProfessors(usersData?.items || []);
		} catch (err: any) {
			setError(err.message);
			setCourses([]);
			setProfessors([]);
                } finally {
                        setIsLoadingForm(false);
                }
        }, []);

        useEffect(() => {
                void fetchCourseGroups(page);
        }, [fetchCourseGroups, page]);

        useEffect(() => {
                void fetchCoursesAndProfessors();
        }, [fetchCoursesAndProfessors]);

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

        const handleSearch = (value: string) => {
                setSearchQuery(value);
                setPage(1);
        };

	const handleCreateGroup = async () => {
		try {
                        await courseGroupsApi.createGroup({
                                courseId: parseInt(formData.courseId),
                                professorId: parseInt(formData.professorId),
                        });
                        toast.success("گروه جدید با موفقیت ایجاد شد");
                        onClose();
                        await fetchCourseGroups(page);
			setFormData({
				courseId: "",
				professorId: "",
			});
		} catch (err: any) {
			toast.error(err.response?.data?.message || "خطا در ایجاد گروه");
		}
	};

        const loadGroupStudents = useCallback(
                async (groupId: number) => {
                        setIsStudentsLoading(true);
                        try {
                                const response = await courseGroupsApi.getGroupStudents(groupId);
                                const payload = response.data as GroupStatusResponse;
                                const combined = Array.isArray(payload.students)
                                        ? payload.students
                                        : [];
                                const normalizedCombined = combined.map((student) =>
                                        normalizeGroupStudent(student)
                                );

                                let enrolledList = normalizedCombined.filter(
                                        (student) => student.isEnrolled
                                );
                                const fallbackEnrolledSource = Array.isArray(
                                        payload.enrolledStudents
                                )
                                        ? payload.enrolledStudents
                                        : Array.isArray(payload.enrolled)
                                        ? payload.enrolled
                                        : [];

                                if (fallbackEnrolledSource.length > 0) {
                                        const normalizedFallback = fallbackEnrolledSource.map((student) =>
                                                normalizeGroupStudent(student, { isEnrolled: true })
                                        );
                                        enrolledList = mergeStudentsById(
                                                enrolledList,
                                                normalizedFallback
                                        );
                                }

                                let availableList = normalizedCombined.filter(
                                        (student) => !student.isEnrolled && student.canEnroll
                                );
                                const fallbackAvailableSource = Array.isArray(
                                        payload.availableStudents
                                )
                                        ? payload.availableStudents
                                        : Array.isArray(payload.available)
                                        ? payload.available
                                        : [];

                                if (fallbackAvailableSource.length > 0) {
                                        const normalizedFallback = fallbackAvailableSource.map(
                                                (student) =>
                                                        normalizeGroupStudent(student, {
                                                                isEnrolled: false,
                                                                canEnroll: true,
                                                        })
                                        );
                                        availableList = mergeStudentsById(
                                                availableList,
                                                normalizedFallback
                                        );
                                }

                                setEnrolledStudents(enrolledList);
                                setAvailableStudents(
                                        availableList.filter((student) => student.canEnroll)
                                );
                                setSelectedGroupInfo(normalizeGroupInfo(payload.groupInfo));
                                setSelectedForAddition([]);
                                setSelectedForRemoval([]);
                        } catch (err: any) {
                                toast.error(
                                        err.response?.data?.message ||
                                                "خطا در دریافت اطلاعات دانشجویان"
                                );
                                setEnrolledStudents([]);
                                setAvailableStudents([]);
                                setSelectedGroupInfo(null);
                        } finally {
                                setIsStudentsLoading(false);
                        }
                },
                []
        );

        const handleManageStudents = async (groupId: number) => {
                setSelectedGroupId(groupId);
                setBulkUsernames("");
                setEnrolledSearch("");
                setAvailableSearch("");
                await loadGroupStudents(groupId);
                onManageStudentsOpen();
        };

        const handleAddStudentsToGroup = async () => {
                if (!selectedGroupId || selectedForAddition.length === 0) {
                        toast.warning("هیچ دانشجویی برای افزودن انتخاب نشده است");
                        return;
                }

                try {
                        await courseGroupsApi.addStudentsToGroup(
                                selectedGroupId,
                                selectedForAddition
                        );
                        toast.success("دانشجویان انتخاب‌شده اضافه شدند");
                        await loadGroupStudents(selectedGroupId);
                        await fetchCourseGroups(page);
                } catch (err: any) {
                        toast.error(err.response?.data?.message || "خطا در افزودن دانشجویان");
                }
        };

        const handleRemoveStudentsFromGroup = async () => {
                if (!selectedGroupId || selectedForRemoval.length === 0) {
                        toast.warning("هیچ دانشجویی برای حذف انتخاب نشده است");
                        return;
                }

                try {
                        await courseGroupsApi.removeStudentsFromGroup(
                                selectedGroupId,
                                selectedForRemoval
                        );
                        toast.success("دانشجویان انتخاب‌شده حذف شدند");
                        await loadGroupStudents(selectedGroupId);
                        await fetchCourseGroups(page);
                } catch (err: any) {
                        toast.error(err.response?.data?.message || "خطا در حذف دانشجویان");
                }
        };

        const handleAvailableSelection = (studentId: number) => {
                setSelectedForAddition((prevSelected) =>
                        prevSelected.includes(studentId)
                                ? prevSelected.filter((id) => id !== studentId)
                                : [...prevSelected, studentId]
                );
        };

        const handleRemovalSelection = (studentId: number) => {
                setSelectedForRemoval((prevSelected) =>
                        prevSelected.includes(studentId)
                                ? prevSelected.filter((id) => id !== studentId)
                                : [...prevSelected, studentId]
                );
        };

        const handleSearchAvailableStudents = async (value: string) => {
                setAvailableSearch(value);
                if (!selectedGroupId) {
                        return;
                }

                if (!value.trim()) {
                        await loadGroupStudents(selectedGroupId);
                        return;
                }

                setIsSearchingAvailable(true);
                try {
                                const response = await courseGroupsApi.searchAvailableStudents(
                                        selectedGroupId,
                                        value
                                );
                        const sources = Array.isArray(response.data.students)
                                ? response.data.students
                                : Array.isArray(response.data.availableStudents)
                                ? response.data.availableStudents
                                : Array.isArray(response.data.available)
                                ? response.data.available
                                : [];
                        const normalized = sources.map((student) =>
                                normalizeGroupStudent(student, {
                                        isEnrolled: false,
                                        canEnroll: true,
                                })
                        );
                        setAvailableStudents(normalized.filter((student) => student.canEnroll));
                } catch (err: any) {
                        toast.error(err.response?.data?.message || "خطا در جستجوی دانشجویان");
                } finally {
                        setIsSearchingAvailable(false);
                }
        };

        const parseUsernames = (value: string) =>
                Array.from(
                        new Set(
                                value
                                        .split(/\s|,|;|\n/)
                                        .map((item) => item.trim())
                                        .filter(Boolean)
                        )
                );

        const handleBulkAddUsernames = async () => {
                if (!selectedGroupId) {
                        toast.error("گروه انتخاب نشده است");
                        return;
                }

                const usernames = parseUsernames(bulkUsernames);

                if (usernames.length === 0) {
                        toast.warning("حداقل یک نام کاربری وارد کنید");
                        return;
                }

                try {
                        const { data } = await courseGroupsApi.bulkEnrollStudents(
                                selectedGroupId,
                                usernames
                        );

                        if (data.successful?.length) {
                                toast.success(
                                        `${data.successful.length} دانشجو با موفقیت اضافه شدند`
                                );
                        }

                        data.errors?.forEach(({ username, reason }) => {
                                toast.error(`${username}: ${reason}`);
                        });

                        setBulkUsernames("");
                        await loadGroupStudents(selectedGroupId);
                        await fetchCourseGroups(page);
                } catch (err: any) {
                        toast.error(err.response?.data?.message || "خطا در افزودن دانشجویان");
                }
        };

        const filteredEnrolledStudents = useMemo(() => {
                const term = enrolledSearch.trim().toLowerCase();
                if (!term) {
                        return enrolledStudents;
                }

                return enrolledStudents.filter((student) => {
                        const fullName = `${student.firstName ?? ""} ${student.lastName ?? ""}`
                                .trim()
                                .toLowerCase();
                        return (
                                student.username.toLowerCase().includes(term) ||
                                fullName.includes(term)
                        );
                });
        }, [enrolledStudents, enrolledSearch]);

        const filteredAvailableStudents = useMemo(() => {
                const term = availableSearch.trim().toLowerCase();
                if (!term) {
                        return availableStudents;
                }

                return availableStudents.filter((student) => {
                        const fullName = `${student.firstName ?? ""} ${student.lastName ?? ""}`
                                .trim()
                                .toLowerCase();
                        return (
                                student.username.toLowerCase().includes(term) ||
                                fullName.includes(term)
                        );
                });
        }, [availableStudents, availableSearch]);

        const bulkUsernameCount = useMemo(
                () => parseUsernames(bulkUsernames).length,
                [bulkUsernames]
        );

	const handleCopyId = (id: number) => {
		navigator.clipboard.writeText(id.toString());
	};

        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!selectedGroupId) {
                        toast.error("گروه انتخاب نشده است");
                        return;
                }

                setSelectedFile(file);
                setIsUploading(true);
                setDuplicateUsers([]);
                setUploadErrors([]);

                const formData = new FormData();
                formData.append("file", file);

                try {
                        const { data } = await api.uploadUsersExcel(
                                formData,
                                role,
                                selectedGroupId,
                                true
                        );

                        const validUsers = [...(data.users || []), ...(data.reactivated || [])];
                        setRegisteredUsers(validUsers);

                        setDuplicateUsers(data.duplicates || []);
                        setUploadErrors(data.errors || []);
                } catch (err: any) {
                        console.error("Upload error:", err);
                        toast.error(err.response?.data?.message || "خطا در آپلود فایل");
                        setRegisteredUsers([]);
                } finally {
                        setIsUploading(false);
                }
        };

        const handleEnrollUploadedUsers = async () => {
                if (!selectedGroupId) {
                        toast.error("گروه انتخاب نشده است");
                        return;
                }

                if (!registeredUsers.length || !selectedFile) {
                        toast.error("هیچ دانشجویی برای ثبت‌نام انتخاب نشده است");
                        return;
                }

                setIsUploading(true);

                try {
                        const formData = new FormData();
                        formData.append("file", selectedFile);

                        const { data } = await api.uploadUsersExcel(
                                formData,
                                role,
                                selectedGroupId
                        );

                        const validUsers = [...(data.users || []), ...(data.reactivated || [])];
                        if (validUsers.length > 0) {
                                toast.success(`${validUsers.length} کاربر با موفقیت افزوده شد`);
                        }

                        data.duplicates?.forEach(
                                (d: { firstName: any; lastName: any; username: any; message: any }) => {
                                        toast.warning(
                                                `${d.firstName} ${d.lastName} (${d.username}): ${d.message}`
                                        );
                                }
                        );

                        data.errors?.forEach((errItem: any) => {
                                toast.error(errItem);
                        });

                        await fetchCourseGroups(page);
                        onUploadExcelClose();
                        setRegisteredUsers([]);
                        setDuplicateUsers([]);
                        setUploadErrors([]);
                        setSelectedFile(null);
                } catch (err: any) {
                        const errorResponse = err.response?.data as ApiErrorResponse;
                        toast.error(errorResponse?.message || "خطا در ثبت‌نام دانشجویان");
                        console.error("Enrollment error:", errorResponse || err);
                } finally {
                        setIsUploading(false);
                }
        };

	const handleDeleteCourseGroup = async (
		groupId: number,
		courseName: string,
		enrollmentCount: number
	) => {
		if (
			!confirm(
				`آیا از حذف این گروه درسی اطمینان دارید؟\n\n` +
					`هشدار: با حذف این گروه، تمامی ${enrollmentCount} ثبت‌نام موجود در آن نیز حذف خواهند شد.\n\n` +
					`درس: ${courseName}\nشماره گروه: ${groupId}`
			)
		)
			return;

                try {
                        await courseGroupsApi.deleteGroup(groupId);
                        toast.success("گروه درسی با موفقیت حذف شد");
                        await fetchCourseGroups(page);
                } catch (err: any) {
                        toast.error(err.response?.data?.message || "خطا در حذف گروه درسی");
                }
        };

	const handleBulkEnrollment = async () => {
		if (!selectedGroupId || !registeredUsers.length) return;

		try {
			const usernames = registeredUsers.map((user) => user.username);
			const { data } = await courseGroupsApi.bulkEnrollStudents(
				selectedGroupId,
				usernames
			);

			if (data.successful?.length) {
				toast.success(
					`${data.successful.length} دانشجو با موفقیت ثبت‌نام شدند`
				);
			}

			data.errors?.forEach(({ username, reason }) => {
				toast.error(`${username}: ${reason}`);
			});

			await fetchCourseGroups(page);
			onUploadExcelClose();
			setRegisteredUsers([]);
		} catch (err: any) {
			toast.error(
				err.response?.data?.message || "خطا در ثبت‌نام گروهی دانشجویان"
			);
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
                                        افزودن گروه درسی جدید
                                </Button>
                        </div>

                        <div className="flex gap-4 items-center">
                                <Input
                                        placeholder="جستجو در گروه‌های درسی..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        startContent={<Search className="w-4 h-4 text-neutral-500" />}
                                        className="w-full max-w-xs"
                                        aria-label="جستجو در گروه‌های درسی"
                                />
                        </div>

			<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
				<CardBody className="p-0">
                                        <Table aria-label="لیست گروه‌های درسی">
                                                <TableHeader>
                                                        <TableColumn>شماره درس</TableColumn>
                                                        <TableColumn>درس</TableColumn>
                                                        <TableColumn>ثبت‌نام فعلی</TableColumn>
                                                        <TableColumn>استاد</TableColumn>
                                                        <TableColumn>عملیات</TableColumn>
                                                </TableHeader>
                                                <TableBody emptyContent="گروه درسی یافت نشد">
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
                                                                                {formatUserName(group?.professor)}
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
                                        aria-label="صفحه‌بندی گروه‌های درسی"
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
                                                        <ModalHeader>افزودن گروه درسی جدید</ModalHeader>
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
                                                                                                        {formatUserName(prof)}
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
                                size="3xl">
                                <ModalContent>
                                        {(onClose) => (
                                                <>
                                                        <ModalHeader className="flex flex-col gap-1">
                                                                <div className="flex items-center justify-between">
                                                                        <h3 className="text-lg font-bold">مدیریت دانشجویان گروه</h3>
                                                                        <Chip size="sm" variant="flat" color="primary">
                                                                                ظرفیت: {selectedGroupInfo?.currentEnrollment ?? 0}/
                                                                                {selectedGroupInfo?.capacity ?? 0}
                                                                        </Chip>
                                                                </div>
                                                                <span className="text-sm text-neutral-500">
                                                                        {selectedGroupInfo?.courseName || "گروه انتخاب‌شده"}
                                                                </span>
                                                        </ModalHeader>
                                                        <ModalBody className="space-y-6">
                                                                <Card>
                                                                        <CardBody className="space-y-4">
                                                                                <div className="flex items-center justify-between">
                                                                                        <span className="font-semibold">دانشجویان ثبت‌نام‌شده</span>
                                                                                        <Chip size="sm" variant="flat" color="success">
                                                                                                {filteredEnrolledStudents.length} نفر
                                                                                        </Chip>
                                                                                </div>
                                                                                <Input
                                                                                        placeholder="جستجو در میان اعضای گروه..."
                                                                                        value={enrolledSearch}
                                                                                        onChange={(e) => setEnrolledSearch(e.target.value)}
                                                                                        startContent={<Search className="w-4 h-4 text-neutral-500" />}
                                                                                        aria-label="جستجوی دانشجویان ثبت‌نام‌شده"
                                                                                />
                                                                                <div className="max-h-[220px] overflow-y-auto border border-neutral-200/60 dark:border-neutral-800/60 rounded-lg">
                                                                                        <Table removeWrapper aria-label="لیست دانشجویان گروه">
                                                                                                <TableHeader>
                                                                                                        <TableColumn className="w-16">انتخاب</TableColumn>
                                                                                                        <TableColumn>نام و نام خانوادگی</TableColumn>
                                                                                                        <TableColumn>نام کاربری</TableColumn>
                                                                                                </TableHeader>
                                                                                                <TableBody
                                                                                                        emptyContent={
                                                                                                                isStudentsLoading
                                                                                                                        ? "در حال بارگذاری..."
                                                                                                                        : "دانشجویی یافت نشد"
                                                                                                        }>
                                                                                                        {filteredEnrolledStudents.map((student) => (
                                                                                                                <TableRow key={student.id}>
                                                                                                                        <TableCell>
                                                                                                                                <Checkbox
                                                                                                                                        isSelected={selectedForRemoval.includes(student.id)}
                                                                                                                                        onValueChange={() => handleRemovalSelection(student.id)}
                                                                                                                                        aria-label={`انتخاب ${formatUserName(student)}`}
                                                                                                                                />
                                                                                                                        </TableCell>
                                                                                                                        <TableCell className="font-medium">{formatUserName(student)}</TableCell>
                                                                                                                        <TableCell className="text-sm text-neutral-500">{student.username}</TableCell>
                                                                                                                </TableRow>
                                                                                                        ))}
                                                                                                </TableBody>
                                                                                        </Table>
                                                                                </div>
                                                                                <div className="flex justify-end">
                                                                                        <Button
                                                                                                color="danger"
                                                                                                variant="flat"
                                                                                                onPress={handleRemoveStudentsFromGroup}
                                                                                                isDisabled={selectedForRemoval.length === 0}
                                                                                        >
                                                                                                حذف دانشجویان انتخاب‌شده
                                                                                        </Button>
                                                                                </div>
                                                                        </CardBody>
                                                                </Card>

                                                                <Divider />

                                                                <Card>
                                                                        <CardBody className="space-y-4">
                                                                                <div className="flex items-center justify-between">
                                                                                        <span className="font-semibold">دانشجویان قابل افزودن</span>
                                                                                        <Chip size="sm" variant="flat" color="primary">
                                                                                                {filteredAvailableStudents.length} نفر
                                                                                        </Chip>
                                                                                </div>
                                                                                <Input
                                                                                        placeholder="جستجوی دانشجوی جدید..."
                                                                                        value={availableSearch}
                                                                                        onChange={(e) => handleSearchAvailableStudents(e.target.value)}
                                                                                        startContent={<Search className="w-4 h-4 text-neutral-500" />}
                                                                                        aria-label="جستجوی دانشجویان برای افزودن"
                                                                                />
                                                                                {isSearchingAvailable && (
                                                                                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                                                                                                <CircularProgress size="sm" aria-label="در حال جستجو" />
                                                                                                در حال جستجو...
                                                                                        </div>
                                                                                )}
                                                                                <div className="max-h-[220px] overflow-y-auto border border-neutral-200/60 dark:border-neutral-800/60 rounded-lg">
                                                                                        <Table removeWrapper aria-label="لیست دانشجویان قابل افزودن">
                                                                                                <TableHeader>
                                                                                                        <TableColumn className="w-16">انتخاب</TableColumn>
                                                                                                        <TableColumn>نام و نام خانوادگی</TableColumn>
                                                                                                        <TableColumn>نام کاربری</TableColumn>
                                                                                                </TableHeader>
                                                                                                <TableBody
                                                                                                        emptyContent={
                                                                                                                isStudentsLoading
                                                                                                                        ? "در حال بارگذاری..."
                                                                                                                        : "دانشجویی برای افزودن یافت نشد"
                                                                                                        }>
                                                                                                        {filteredAvailableStudents.map((student) => (
                                                                                                                <TableRow key={student.id}>
                                                                                                                        <TableCell>
                                                                                                                                <Checkbox
                                                                                                                                        isSelected={selectedForAddition.includes(student.id)}
                                                                                                                                        onValueChange={() => handleAvailableSelection(student.id)}
                                                                                                                                        isDisabled={!student.canEnroll}
                                                                                                                                        aria-label={`انتخاب ${formatUserName(student)}`}
                                                                                                                                />
                                                                                                                        </TableCell>
                                                                                                                        <TableCell className="font-medium">{formatUserName(student)}</TableCell>
                                                                                                                        <TableCell className="text-sm text-neutral-500">{student.username}</TableCell>
                                                                                                                </TableRow>
                                                                                                        ))}
                                                                                                </TableBody>
                                                                                        </Table>
                                                                                </div>
                                                                                <div className="flex justify-end">
                                                                                        <Button
                                                                                                color="primary"
                                                                                                variant="flat"
                                                                                                onPress={handleAddStudentsToGroup}
                                                                                                isDisabled={selectedForAddition.length === 0}
                                                                                        >
                                                                                                افزودن دانشجویان انتخاب‌شده
                                                                                        </Button>
                                                                                </div>
                                                                        </CardBody>
                                                                </Card>

                                                                <Card>
                                                                        <CardBody className="space-y-3">
                                                                                <div className="flex items-center justify-between">
                                                                                        <span className="font-semibold">افزودن با نام کاربری</span>
                                                                                        <Chip size="sm" variant="flat" color="secondary">
                                                                                                {bulkUsernameCount} نام کاربری
                                                                                        </Chip>
                                                                                </div>
                                                                                <Textarea
                                                                                        minRows={4}
                                                                                        placeholder="نام‌های کاربری را با فاصله، ویرگول یا خط جدید جدا کنید"
                                                                                        value={bulkUsernames}
                                                                                        onChange={(e) => setBulkUsernames(e.target.value)}
                                                                                        aria-label="افزودن گروهی دانشجویان"
                                                                                />
                                                                                <p className="text-xs text-neutral-500">
                                                                                        مثال: <span className="font-mono">student1 student2 student3</span>
                                                                                </p>
                                                                                <div className="flex justify-end">
                                                                                        <Button
                                                                                                color="primary"
                                                                                                onPress={handleBulkAddUsernames}
                                                                                                isDisabled={bulkUsernames.trim().length === 0}
                                                                                        >
                                                                                                افزودن نام‌های کاربری
                                                                                        </Button>
                                                                                </div>
                                                                        </CardBody>
                                                                </Card>
                                                        </ModalBody>
                                                        <ModalFooter>
                                                                <Button color="danger" variant="light" onPress={onClose}>
                                                                        بستن
                                                                </Button>
                                                        </ModalFooter>
                                                </>
                                        )}
                                </ModalContent>
                        </Modal>

			{/* Upload Excel Modal */}
                        <Modal
                                isOpen={isUploadExcelOpen}
                                onClose={() => {
                                        setRegisteredUsers([]);
                                        setDuplicateUsers([]);
                                        setUploadErrors([]);
                                        setSelectedFile(null);
                                        setRole("student");
                                        onUploadExcelClose();
                                }}
                                size="4xl">
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
                                                                        <Select
                                                                                label="نقش کاربران"
                                                                                selectedKeys={[role]}
                                                                                onChange={(e) => setRole(e.target.value)}
                                                                                className="text-right">
                                                                                <SelectItem key="student" value="student">
                                                                                        دانشجو
                                                                                </SelectItem>
                                                                                <SelectItem key="teacher" value="teacher">
                                                                                        استاد
                                                                                </SelectItem>
                                                                                <SelectItem key="admin" value="admin">
                                                                                        مدیر سیستم
                                                                                </SelectItem>
                                                                        </Select>
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
                                                                                                        aria-label="آپلود فایل کاربران"
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
                                                                                                                        {registeredUsers.length} کاربر استخراج شده
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
                                                                                افزودن {registeredUsers.length} کاربر به گروه
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
