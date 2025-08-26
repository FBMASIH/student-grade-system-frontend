"use client";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button, Card, CardBody, Chip } from "@nextui-org/react";
import { AlertCircle, BookOpen, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScoreSubmissionModal } from "./components/ScoreSubmissionModal";
import { ScoreUploadModal } from "./components/ScoreUploadModal";

interface Group {
  id: number;
  groupNumber: number;
}

interface Course {
  id: number;
  name: string;
  groups: Group[];
}

interface Student {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  score?: number;
}

export default function TeacherDashboard() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<{
    groupId: number;
    courseName: string;
    groupNumber: number;
    students: Student[];
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadGroupId, setUploadGroupId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    loadCourses();
  }, [token, user]);

  const loadCourses = async () => {
    try {
      if (!user) return;
      const res = await api.getProfessorCourses(user.id);
      const data = res.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        groups: c.groups || [],
      }));
      setCourses(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("خطا در دریافت دروس");
    }
  };

  const openScoreModal = async (course: Course, group: Group) => {
    try {
      const res = await api.getCourseStudents(course.id);
      const students = res.data
        .filter((s: any) => s.groupNumber === group.groupNumber)
        .map((s: any) => ({
          id: s.id,
          username: s.username,
          firstName: s.firstName,
          lastName: s.lastName,
          score: s.score ?? undefined,
        }));
      setSelectedGroup({
        groupId: group.id,
        courseName: course.name,
        groupNumber: group.groupNumber,
        students,
      });
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message);
      toast.error("خطا در دریافت لیست دانشجویان");
    }
  };

  const openUploadModal = (group: Group) => {
    setUploadGroupId(group.id);
    setIsUploadModalOpen(true);
  };

  const handleSubmitScores = async (scores: Record<number, number>) => {
    if (!selectedGroup) return;
    try {
      const formatted = Object.entries(scores).map(([id, score]) => ({
        studentId: Number(id),
        score,
      }));
      await api.submitGroupScores(selectedGroup.groupId, formatted);
      toast.success("نمرات ثبت شد");
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
      toast.error("خطا در ثبت نمرات");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-900/50" dir="rtl">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-6 xl:p-8 space-y-6">
        <div className="space-y-1 mb-8">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold">پنل استاد</h1>
          <p className="text-neutral-600 dark:text-neutral-400">مدیریت دروس و ثبت نمرات</p>
        </div>

        <div className="grid gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="border border-neutral-200/50 dark:border-neutral-800/50"
            >
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold">{course.name}</h3>
                  </div>
                  <Chip
                    variant="flat"
                    color="primary"
                    className="h-8"
                  >
                    {course.groups.length} گروه
                  </Chip>
                </div>
                <div className="space-y-2">
                  {course.groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                    >
                      <span>گروه {group.groupNumber}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          endContent={<ChevronRight className="w-4 h-4" />}
                          onClick={() => openScoreModal(course, group)}
                        >
                          مدیریت نمرات
                        </Button>
                        <Button
                          size="sm"
                          color="secondary"
                          variant="flat"
                          onClick={() => openUploadModal(group)}
                        >
                          آپلود اکسل
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {error && (
          <div className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-4 rounded-xl shadow-lg flex items-center gap-3 max-w-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <ScoreSubmissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          groupInfo=
            {selectedGroup
              ? {
                  courseName: selectedGroup.courseName,
                  groupNumber: selectedGroup.groupNumber,
                  students: selectedGroup.students,
                }
              : null}
          onSubmitScores={handleSubmitScores}
        />
        <ScoreUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          groupId={uploadGroupId}
        />
      </div>
    </div>
  );
}

