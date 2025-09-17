"use client";

import { api } from "@/lib/api";
import { PaginatedResponse } from "@/lib/types/common";
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
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	useDisclosure,
} from "@nextui-org/react";
import { AlertCircle, Book, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface Course {
        id: number;
        name: string;
        code: string;
        groups: CourseGroup[];
}

interface CourseGroup {
	id: number;
	name: string;
	professor: { name: string };
	capacity: number;
	enrollments: any[];
}

export default function CoursesManagement() {
	const [courses, setCourses] = useState<Course[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
        const [searchQuery, setSearchQuery] = useState("");
        const debouncedSearch = useDebounce(searchQuery, 500);
        const [formData, setFormData] = useState({
                name: "",
                code: "",
        });
	const [error, setError] = useState("");
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [isLoading, setIsLoading] = useState(true);

        const fetchCourses = useCallback(async (currentPage: number, query: string) => {
                try {
                        setIsLoading(true);
                        const response = await api.getAllCourses(currentPage, 10, query);
                        const paginatedData = response.data as PaginatedResponse;

                        setCourses(paginatedData.items);
                        setTotalPages(paginatedData.meta.totalPages);
                } catch (err: any) {
                        console.error("Error fetching courses:", err);
                        setError(err.message);
                        setCourses([]);
                } finally {
                        setIsLoading(false);
                }
        }, []);

        useEffect(() => {
                void fetchCourses(page, debouncedSearch);
        }, [debouncedSearch, fetchCourses, page]);

        const handleSearch = (value: string) => {
                setSearchQuery(value);
                setPage(1);
        };

        const handleCreateCourse = async () => {
                try {
                        await api.createCourse({
                                name: formData.name,
                                code: formData.code,
                        });
                        onClose();
                        await fetchCourses(page, debouncedSearch);
                        setFormData({
                                name: "",
                                code: "",
                        });
                        setError("");
                } catch (err: any) {
                        setError(err.message);
                }
        };

	const handleDeleteCourse = async (id: number) => {
		if (!confirm("آیا از حذف این درس اطمینان دارید؟")) return;

                try {
                        await api.deleteCourse(id);
                        await fetchCourses(page, debouncedSearch);
                } catch (err: any) {
                        setError(err.message);
                }
        };

        return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
                                <div>
                                        <h2 className="text-2xl font-bold">مدیریت درس</h2>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                                {courses.length} درس فعال در سیستم
                                        </p>
                                </div>
                                <Button
                                        color="primary"
                                        startContent={<Plus className="w-4 h-4" />}
                                        onPress={onOpen}>
                                        افزودن درس جدید
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
                                                                        placeholder="جستجو در درس..."
                                                                        value={searchQuery}
                                                                        onChange={(e) => handleSearch(e.target.value)}
                                                                        startContent={<Search className="w-4 h-4 text-neutral-500" />}
                                                                        className="w-full sm:w-72"
                                                                        aria-label="جستجو در درس‌ها"
                                                                />
                                                        </div>

                                                        <Table aria-label="لیست درس">
                                                                <TableHeader>
                                                                        <TableColumn>کد درس</TableColumn>
                                                                        <TableColumn>نام درس</TableColumn>
                                                                        <TableColumn>تعداد گروه‌ها</TableColumn>
                                                                        <TableColumn>عملیات</TableColumn>
                                                                </TableHeader>
                                                                <TableBody emptyContent="درسی یافت نشد">
                                                                        {courses.map((course) => (
                                                                                <TableRow key={course.id}>
                                                                                        <TableCell>
                                                                                                <Chip variant="flat" color="primary">
                                                                                                        {course.code}
                                                                                                </Chip>
                                                                                        </TableCell>
                                                                                        <TableCell>{course.name}</TableCell>
                                                                                        <TableCell>
                                                                                                <div className="flex items-center gap-2">
                                                                                                        <Book className="w-4 h-4 text-neutral-500" />
                                                                                                        {course.groups?.length || 0} گروه
                                                                                                </div>
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                                <div className="flex gap-2">
                                                                                                        <Button
                                                                                                                color="danger"
                                                                                                                variant="flat"
                                                                                                                size="sm"
                                                                                                                onClick={() => handleDeleteCourse(course.id)}>
                                                                                                                حذف درس
                                                                                                        </Button>
                                                                                                </div>
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
                                        aria-label="صفحه‌بندی درس‌ها"
                                />
                        </div>

			{error && (
				<div className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-4 rounded-xl shadow-lg flex items-center gap-3">
					<AlertCircle className="w-5 h-5" />
					<p>{error}</p>
				</div>
			)}

			{/* Add Course Modal */}
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>افزودن درس جدید</ModalHeader>
							<ModalBody className="gap-4">
								<Input
									label="نام درس"
									placeholder="مثال: ریاضی ۱"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
								/>
								<Input
									label="کد درس"
									placeholder="مثال: MATH101"
									value={formData.code}
									onChange={(e) =>
										setFormData({ ...formData, code: e.target.value })
									}
								/>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									انصراف
								</Button>
								<Button
									color="primary"
									onPress={handleCreateCourse}
                                                                        isDisabled={!formData.name || !formData.code}>
									افزودن درس
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
