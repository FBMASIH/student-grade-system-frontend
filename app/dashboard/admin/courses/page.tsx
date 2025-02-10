"use client";

import { api } from "@/lib/api";
import {
    Card,
    CardBody,
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Button,
    Input,
    Chip,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@nextui-org/react";
import { Book, Users, Search, Plus, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState("");
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const { data } = await api.getAllCourses();
            setCourses(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">مدیریت دروس</h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        {courses.length} درس فعال در سیستم
                    </p>
                </div>
                <Button
                    color="primary"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={onOpen}
                >
                    افزودن درس جدید
                </Button>
            </div>

            <Card className="border border-neutral-200/50 dark:border-neutral-800/50">
                <CardBody className="p-0">
                    <div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
                        <Input
                            placeholder="جستجو در دروس..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            startContent={<Search className="w-4 h-4 text-neutral-500" />}
                            className="w-full sm:w-72"
                        />
                    </div>

                    <Table aria-label="لیست دروس">
                        <TableHeader>
                            <TableColumn>کد درس</TableColumn>
                            <TableColumn>نام درس</TableColumn>
                            <TableColumn>تعداد گروه‌ها</TableColumn>
                            <TableColumn>ظرفیت کل</TableColumn>
                            <TableColumn>عملیات</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="درسی یافت نشد">
                            {filteredCourses.map((course) => (
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
                                            {course.groups.length} گروه
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-neutral-500" />
                                            {course.groups.reduce((acc, group) => acc + group.capacity, 0)} نفر
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                size="sm"
                                            >
                                                مدیریت گروه‌ها
                                            </Button>
                                            <Button
                                                color="danger"
                                                variant="flat"
                                                size="sm"
                                            >
                                                حذف درس
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

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
                            <ModalBody>
                                {/* Add form fields here */}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    انصراف
                                </Button>
                                <Button color="primary">
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
