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
    Input,
    Button,
    Select,
    SelectItem,
    Chip,
} from "@nextui-org/react";
import { GraduationCap, Search, UserPlus, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface Enrollment {
    id: number;
    student: { id: number; name: string };
    group: { 
        id: number;
        name: string;
        course: { name: string };
        professor: { name: string };
    };
    score?: number;
}

export default function EnrollmentsManagement() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        // In a real app, you would fetch enrollments for the selected group or student
    }, []);

    const handleCreateEnrollment = async () => {
        if (!selectedStudent || !selectedGroup) return;
        
        try {
            await api.createEnrollment(
                parseInt(selectedStudent),
                parseInt(selectedGroup)
            );
            // Refresh enrollments
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
                        onClick={handleCreateEnrollment}
                    >
                        ثبت‌نام دانشجو
                    </Button>
                </CardBody>
            </Card>

            {/* Enrollments List */}
            <Card className="border border-neutral-200/50 dark:border-neutral-800/50">
                <CardBody className="p-0">
                    <div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
                        <Input
                            placeholder="جستجو در ثبت‌نام‌ها..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                            <TableColumn>عملیات</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="ثبت‌نامی یافت نشد">
                            {enrollments.map((enrollment) => (
                                <TableRow key={enrollment.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4 text-neutral-500" />
                                            {enrollment.student.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span>{enrollment.group.course.name}</span>
                                            <Chip size="sm" variant="flat">
                                                گروه {enrollment.group.name}
                                            </Chip>
                                        </div>
                                    </TableCell>
                                    <TableCell>{enrollment.group.professor.name}</TableCell>
                                    <TableCell>
                                        {enrollment.score ?? "ثبت نشده"}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            color="danger"
                                            variant="flat"
                                            size="sm"
                                        >
                                            حذف ثبت‌نام
                                        </Button>
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
        </div>
    );
}
