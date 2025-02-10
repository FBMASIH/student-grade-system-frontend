"use client";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import {
  Card,
  CardBody,
  Input,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Badge,
} from "@nextui-org/react";
import { Check, PenSquare, AlertCircle, Users, ScrollText, FileCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Enrollment {
  id: number;
  student: { id: number; name: string };
  group: {
    id: number;
    name: string;
    course: { name: string };
  };
  score?: number;
}

export default function TeacherDashboard() {
  const { token } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    loadTeacherData();
  }, [token, router]);

  const loadTeacherData = async () => {
    try {
      const coursesRes = await api.getProfessorCourses(1); // Replace with actual professor ID
      setCourses(coursesRes.data);

      if (selectedGroup) {
        const enrollmentsRes = await api.getGroupEnrollments(Number(selectedGroup));
        setEnrollments(enrollmentsRes.data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmitGrade = async (enrollmentId: number, score: number) => {
    try {
      await api.updateEnrollmentGrade(enrollmentId, score);
      await loadTeacherData(); // Refresh data
      alert("نمره با موفقیت ثبت شد");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-900/50" dir="rtl">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-6 xl:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold">پنل استاد</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              مدیریت نمرات و اعتراضات دانشجویان
            </p>
          </div>
          <div className="flex gap-3">
            <Chip
              startContent={<Users className="w-4 h-4" />}
              variant="flat"
              color="primary"
              size="lg"
              className="h-12 px-6"
            >
              {enrollments.length} اعتراض جدید
            </Chip>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Grade Assignment Card */}
          <Card className="xl:col-span-1 border border-neutral-200/50 dark:border-neutral-800/50 hover:border-primary/50 transition-colors">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <PenSquare className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">ثبت نمره جدید</h2>
              </div>

              <div className="space-y-4">
                <Input
                  type="number"
                  label="شماره دانشجویی"
                  placeholder="مثال: 400123456"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  variant="bordered"
                  classNames={{
                    label: "text-right",
                    input: "text-right"
                  }}
                />
                <Input
                  label="نام درس"
                  placeholder="مثال: ریاضی ۱"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  variant="bordered"
                  classNames={{
                    label: "text-right",
                    input: "text-right"
                  }}
                />
                <Input
                  type="number"
                  label="نمره"
                  placeholder="از ۰ تا ۲۰"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  variant="bordered"
                  classNames={{
                    label: "text-right",
                    input: "text-right"
                  }}
                />
              </div>

              <Button
                color="primary"
                className="w-full mt-6 h-12 text-base font-medium"
                startContent={<FileCheck className="w-5 h-5" />}
                onClick={() => handleSubmitGrade(Number(selectedGroup), Number(selectedGroup))}
              >
                ثبت نمره
              </Button>
            </CardBody>
          </Card>

          {/* Objections Table Card */}
          <Card className="xl:col-span-2 border border-neutral-200/50 dark:border-neutral-800/50">
            <CardBody className="p-0">
              <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <ScrollText className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">لیست اعتراضات</h2>
                  </div>
                  <Chip
                    variant="flat"
                    size="sm"
                    className="h-8 px-4 text-base"
                  >
                    {enrollments.length} اعتراض
                  </Chip>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table 
                  removeWrapper 
                  aria-label="لیست اعتراضات"
                  classNames={{
                    base: "min-w-full",
                    table: "min-w-full",
                    thead: "bg-neutral-50/50 dark:bg-neutral-800/50",
                    th: [
                      "text-right",
                      "bg-transparent",
                      "text-neutral-700 dark:text-neutral-300",
                      "text-sm",
                      "font-medium",
                      "py-4 px-6",
                      "whitespace-nowrap"
                    ].join(" "),
                    td: [
                      "text-right",
                      "py-4 px-6",
                      "text-neutral-600 dark:text-neutral-400",
                      "border-b border-neutral-200/50 dark:border-neutral-800/50"
                    ].join(" ")
                  }}
                >
                  <TableHeader>
                    <TableColumn className="text-right">نام درس</TableColumn>
                    <TableColumn className="text-right">نام دانشجو</TableColumn>
                    <TableColumn className="text-right">نمره</TableColumn>
                    <TableColumn className="text-right">دلیل اعتراض</TableColumn>
                    <TableColumn className="text-right">وضعیت</TableColumn>
                    <TableColumn className="text-right">عملیات</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="اعتراضی یافت نشد">
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.group.course.name}</TableCell>
                        <TableCell>{enrollment.student.name}</TableCell>
                        <TableCell>{enrollment.score}</TableCell>
                        <TableCell>
                          <p className="max-w-xs truncate">{enrollment.group.name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            color={enrollment.score ? "success" : "warning"}
                            variant="flat"
                          >
                            {enrollment.score ? "بررسی شده" : "در انتظار بررسی"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            isDisabled={!!enrollment.score}
                            color="success"
                            variant="flat"
                            size="sm"
                            startContent={<Check className="w-4 h-4" />}
                            onClick={() => handleSubmitGrade(enrollment.id, Number(selectedGroup))}
                          >
                            تایید بررسی
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in max-w-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
