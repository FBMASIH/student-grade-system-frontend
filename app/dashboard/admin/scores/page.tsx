"use client";

import { api, courseGroupsApi } from "@/lib/api";
import { PaginatedResponse } from "@/lib/types/common";
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
        Pagination,
        Table,
        TableBody,
        TableCell,
        TableColumn,
        TableHeader,
        TableRow,
        useDisclosure,
} from "@nextui-org/react";
import { AlertCircle, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ScoreSubmissionModal as GroupScoreSubmissionModal } from "@/app/dashboard/teacher/components/ScoreSubmissionModal";

interface StudentEnrollment {
        id: number;
        student: {
                id: number;
                username: string;
                firstName: string;
                lastName: string;
        };
        group: {
                id: number;
                course: {
                        id: number;
                        name: string;
                } | null;
        };
        score: number | null;
}

interface CourseGroupOption {
        id: number;
        groupNumber: number;
        course: {
                id: number;
                name: string;
        };
}

interface GroupStudentInfo {
        id: number;
        username: string;
        firstName: string;
        lastName: string;
        score?: number;
}

interface GroupScoreContext {
        groupId: number;
        courseId: number;
        courseName: string;
        groupNumber: number;
        students: GroupStudentInfo[];
}

export default function ScoresManagement() {
        const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
        const [page, setPage] = useState(1);
        const [totalPages, setTotalPages] = useState(1);
        const [searchQuery, setSearchQuery] = useState("");
        const [selectedEnrollment, setSelectedEnrollment] =
                useState<StudentEnrollment | null>(null);
        const [score, setScore] = useState<number | null>(null);
        const [error, setError] = useState("");
        const { isOpen, onOpen, onClose } = useDisclosure();
        const [isLoading, setIsLoading] = useState(true);
        const searchTimeout = useRef<NodeJS.Timeout | null>(null);
        const {
                isOpen: isGroupSelectionOpen,
                onOpen: onGroupSelectionOpen,
                onClose: onGroupSelectionClose,
        } = useDisclosure();
        const [courseGroups, setCourseGroups] = useState<CourseGroupOption[]>([]);
        const [selectedGroupIdForScores, setSelectedGroupIdForScores] = useState<string>("");
        const [isFetchingGroupStudents, setIsFetchingGroupStudents] = useState(false);
        const [groupScoreContext, setGroupScoreContext] = useState<GroupScoreContext | null>(null);
        const [isGroupScoreModalOpen, setIsGroupScoreModalOpen] = useState(false);

        const loadCourseGroups = useCallback(async () => {
                try {
                        const { data } = await courseGroupsApi.getAllGroups(1, 100);
                        setCourseGroups(data?.items ?? []);
                } catch (err: any) {
                        toast.error(err.response?.data?.message || "خطا در دریافت گروه‌های درسی");
                }
        }, []);

        useEffect(() => {
                fetchEnrollments(page, searchQuery);
        }, [page, searchQuery]);

        useEffect(() => {
                void loadCourseGroups();
        }, [loadCourseGroups]);

	const fetchEnrollments = async (currentPage: number, query: string) => {
		try {
			setIsLoading(true);
			const response = await api.getAllEnrollments(currentPage, 10, query);
			const paginatedData = response.data as PaginatedResponse;

			setEnrollments(paginatedData.items);
			setTotalPages(paginatedData.meta.totalPages);
		} catch (err: any) {
			console.error("Error fetching enrollments:", err);
			setError(err.message);
			setEnrollments([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = (value: string) => {
		setSearchQuery(value);
		setPage(1);
		if (searchTimeout.current) {
			clearTimeout(searchTimeout.current);
		}
		searchTimeout.current = setTimeout(() => {
			fetchEnrollments(1, value);
		}, 500);
	};

	const handleOpenModal = (enrollment: StudentEnrollment) => {
		setSelectedEnrollment(enrollment);
		setScore(enrollment.score);
		onOpen();
	};

        const handleSubmitScore = async () => {
                if (selectedEnrollment && score !== null) {
                        try {
                                await api.updateScore(selectedEnrollment.id, score);
                                onClose();
                                fetchEnrollments(page, searchQuery);
                        } catch (err: any) {
                                setError(err.message);
                        }
                }
        };

        const handleOpenGroupSelection = () => {
                if (!courseGroups.length) {
                        void loadCourseGroups();
                }
                setSelectedGroupIdForScores("");
                onGroupSelectionOpen();
        };

        const handleConfirmGroupSelection = async () => {
                if (!selectedGroupIdForScores) {
                        toast.warning("لطفاً یک گروه را انتخاب کنید");
                        return;
                }

                const groupId = Number(selectedGroupIdForScores);
                const selectedGroup = courseGroups.find((group) => group.id === groupId);

                if (!selectedGroup) {
                        toast.error("گروه انتخاب‌شده معتبر نیست");
                        return;
                }

                setIsFetchingGroupStudents(true);
                try {
                        const { data } = await api.getCourseStudents(selectedGroup.course.id);
                        const students = (data || [])
                                .filter((student) => student.groupNumber === selectedGroup.groupNumber)
                                .map((student) => ({
                                        id: student.id,
                                        username: student.username,
                                        firstName: student.firstName,
                                        lastName: student.lastName,
                                        score: student.score ?? undefined,
                                }));

                        if (students.length === 0) {
                                toast.warning("دانشجویی برای این گروه یافت نشد");
                        }

                        setGroupScoreContext({
                                groupId,
                                courseId: selectedGroup.course.id,
                                courseName: selectedGroup.course.name,
                                groupNumber: selectedGroup.groupNumber,
                                students,
                        });
                        setIsGroupScoreModalOpen(true);
                        onGroupSelectionClose();
                        setSelectedGroupIdForScores("");
                } catch (err: any) {
                        setError(err.message);
                        toast.error(err.response?.data?.message || "خطا در دریافت دانشجویان گروه");
                } finally {
                        setIsFetchingGroupStudents(false);
                }
        };

        const handleSubmitGroupScores = async (scores: Record<number, number>) => {
                if (!groupScoreContext) {
                        return;
                }

                try {
                        const formatted = Object.entries(scores).map(([studentId, value]) => ({
                                studentId: Number(studentId),
                                score: Number(value),
                        }));

                        await api.submitGroupScores(groupScoreContext.groupId, formatted);
                        toast.success("نمرات گروه با موفقیت ثبت شد");
                        setIsGroupScoreModalOpen(false);
                        setGroupScoreContext(null);
                        fetchEnrollments(page, searchQuery);
                } catch (err: any) {
                        setError(err.message);
                        toast.error(err.response?.data?.message || "خطا در ثبت نمرات گروه");
                        throw err;
                }
        };

        const handleCloseGroupScoreModal = () => {
                setIsGroupScoreModalOpen(false);
                setGroupScoreContext(null);
        };

	return (
		<div className="space-y-6">
                <div className="flex justify-between items-center">
                        <div>
                                <h2 className="text-2xl font-bold">مدیریت نمرات دانشجویان</h2>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                        {enrollments.length} ثبت‌نام فعال در سیستم
                                </p>
                        </div>
                        <Button color="primary" variant="flat" onPress={handleOpenGroupSelection}>
                                ثبت نمره گروهی
                        </Button>
                </div>

			<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
				<CardBody className="p-0">
					{isLoading ? (
						<div className="p-4 text-center">Loading...</div>
					) : (
						<>
							<div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
                                                                <Input
                                                                        placeholder="جستجو در ثبت‌نام‌ها..."
                                                                        value={searchQuery}
                                                                        onChange={(e) => handleSearch(e.target.value)}
                                                                        startContent={<Search className="w-4 h-4 text-neutral-500" />}
                                                                        className="w-full sm:w-72"
                                                                        aria-label="جستجو در ثبت‌نام‌ها"
                                                                />
							</div>

							<Table aria-label="لیست ثبت‌نام‌ها">
								<TableHeader>
									<TableColumn>نام کاربری دانشجو</TableColumn>
									<TableColumn>نام</TableColumn>
									<TableColumn>نام خانوادگی</TableColumn>
									<TableColumn>درس</TableColumn>
									<TableColumn>نمره</TableColumn>
									<TableColumn>عملیات</TableColumn>
								</TableHeader>
								<TableBody emptyContent="ثبت‌نامی یافت نشد">
									{enrollments.map((enrollment) => (
										<TableRow key={enrollment.id}>
											<TableCell>{enrollment.student.username}</TableCell>
											<TableCell>{enrollment.student.firstName}</TableCell>
											<TableCell>{enrollment.student.lastName}</TableCell>
											<TableCell>
												{enrollment.group.course?.name || "---"}
											</TableCell>
											<TableCell>
												{enrollment.score !== null ? enrollment.score : "---"}
											</TableCell>
											<TableCell>
												<Button
													color="primary"
													variant="flat"
													size="sm"
													onClick={() => handleOpenModal(enrollment)}>
													ثبت نمره
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
                                        aria-label="صفحه‌بندی نمرات"
                                />
                        </div>

			{error && (
				<div className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-4 rounded-xl shadow-lg flex items-center gap-3">
					<AlertCircle className="w-5 h-5" />
					<p>{error}</p>
				</div>
			)}

			{/* Submit Score Modal */}
                        <Modal isOpen={isOpen} onClose={onClose}>
                                <ModalContent>
                                        {(onClose) => (
                                                <>
                                                        <ModalHeader>ثبت نمره</ModalHeader>
                                                        <ModalBody className="gap-4">
                                                                <Input
                                                                        label="نمره"
                                                                        type="number"
                                                                        placeholder="مثال: 85"
                                                                        value={score !== null ? score.toString() : ""}
                                                                        onChange={(e) => setScore(Number(e.target.value))}
                                                                />
                                                        </ModalBody>
                                                        <ModalFooter>
                                                                <Button color="danger" variant="light" onPress={onClose}>
                                                                        انصراف
                                                                </Button>
                                                                <Button
                                                                        color="primary"
                                                                        onPress={handleSubmitScore}
                                                                        isDisabled={score === null || score < 0 || score > 100}>
                                                                        ثبت نمره
                                                                </Button>
                                                        </ModalFooter>
                                                </>
                                        )}
                                </ModalContent>
                        </Modal>

                        <Modal
                                isOpen={isGroupSelectionOpen}
                                onClose={() => {
                                        onGroupSelectionClose();
                                        setSelectedGroupIdForScores("");
                                }}>
                                <ModalContent>
                                        {(onClose) => (
                                                <>
                                                        <ModalHeader>انتخاب گروه برای ثبت نمره</ModalHeader>
                                                        <ModalBody className="space-y-4">
                                                                <Select
                                                                        label="گروه درسی"
                                                                        placeholder="یک گروه را انتخاب کنید"
                                                                        selectedKeys={
                                                                                selectedGroupIdForScores
                                                                                        ? [selectedGroupIdForScores]
                                                                                        : []
                                                                        }
                                                                        onChange={(e) => setSelectedGroupIdForScores(e.target.value)}
                                                                        isDisabled={courseGroups.length === 0}
                                                                >
                                                                        {courseGroups.map((group) => (
                                                                                <SelectItem
                                                                                        key={group.id.toString()}
                                                                                        value={group.id.toString()}>
                                                                                        {group.course?.name ?? "درس نامشخص"} -
                                                                                        گروه {group.groupNumber}
                                                                                </SelectItem>
                                                                        ))}
                                                                </Select>
                                                                {courseGroups.length === 0 && (
                                                                        <p className="text-sm text-neutral-500">
                                                                                هیچ گروهی برای ثبت نمره یافت نشد. ابتدا گروه‌های
                                                                                درسی را ایجاد کنید.
                                                                        </p>
                                                                )}
                                                        </ModalBody>
                                                        <ModalFooter>
                                                                <Button color="danger" variant="light" onPress={onClose}>
                                                                        انصراف
                                                                </Button>
                                                                <Button
                                                                        color="primary"
                                                                        onPress={handleConfirmGroupSelection}
                                                                        isDisabled={!selectedGroupIdForScores}
                                                                        isLoading={isFetchingGroupStudents}>
                                                                        ادامه
                                                                </Button>
                                                        </ModalFooter>
                                                </>
                                        )}
                                </ModalContent>
                        </Modal>

                        <GroupScoreSubmissionModal
                                isOpen={isGroupScoreModalOpen}
                                onClose={handleCloseGroupScoreModal}
                                groupInfo={
                                        groupScoreContext
                                                ? {
                                                          courseName: groupScoreContext.courseName,
                                                          groupNumber: groupScoreContext.groupNumber,
                                                          students: groupScoreContext.students,
                                                  }
                                                : null
                                }
                                onSubmitScores={handleSubmitGroupScores}
                        />
                </div>
        );
}
