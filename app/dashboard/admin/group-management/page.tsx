"use client";

import { groupsApi } from "@/lib/api";
import { Group } from "@/lib/types/common";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Divider,
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
  Textarea,
  useDisclosure,
} from "@nextui-org/react";
import { AlertCircle, Plus, Search, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface GroupStudent {
  id: number;
  username: string;
  isEnrolled: boolean;
  canEnroll: boolean;
}

interface GroupInfo {
  id: number;
  groupNumber?: number;
  courseName?: string;
  capacity?: number;
  currentEnrollment?: number;
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

const normalizeGroupStudent = (
  student: RawGroupStudent,
  overrides?: { isEnrolled?: boolean; canEnroll?: boolean }
): GroupStudent => {
  const resolvedIsEnrolled =
    typeof overrides?.isEnrolled === "boolean"
      ? overrides.isEnrolled
      : typeof student.isEnrolled === "boolean"
      ? student.isEnrolled
      : typeof student.is_enrolled === "boolean"
      ? student.is_enrolled
      : false;

  const resolvedCanEnroll =
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
    isEnrolled: resolvedIsEnrolled,
    canEnroll: resolvedCanEnroll,
  };
};

const normalizeGroupInfo = (info?: RawGroupInfo | null): GroupInfo | null => {
  if (!info) return null;

  const toOptionalNumber = (value: unknown): number | undefined =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

  const toOptionalString = (value: unknown): string | undefined =>
    typeof value === "string" ? value.trim() : value != null ? String(value) : undefined;

  return {
    id: info.id,
    groupNumber: toOptionalNumber(info.groupNumber ?? info.group_number),
    courseName: toOptionalString(info.courseName ?? info.course_name),
    capacity: toOptionalNumber(info.capacity),
    currentEnrollment: toOptionalNumber(info.currentEnrollment ?? info.current_enrollment),
  };
};

export default function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isManageStudentsOpen,
    onOpen: onManageStudentsOpen,
    onClose: onManageStudentsClose,
  } = useDisclosure();
  const [formName, setFormName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupStudents, setGroupStudents] = useState<GroupStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [bulkUsernames, setBulkUsernames] = useState("");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  const fetchGroups = useCallback(
    async (currentPage: number, query: string) => {
      try {
        const { data } = await groupsApi.getAllGroups(currentPage, 10, query);
        const items = data?.items ?? [];
        setGroups(items);
        const fallbackTotalPages = items.length > 0 ? Math.max(1, Math.ceil(items.length / 10)) : 1;
        setTotalPages(data?.meta?.totalPages ?? fallbackTotalPages);
      } catch (err: any) {
        setError(err.message);
        setGroups([]);
      }
    },
    []
  );

  useEffect(() => {
    fetchGroups(page, search);
  }, [page, search, fetchGroups]);

  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    onOpen();
  };

  const openEdit = (g: Group) => {
    setEditingId(g.id);
    setFormName(g.name);
    onOpen();
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await groupsApi.updateGroup(editingId, { name: formName });
      } else {
        await groupsApi.createGroup({ name: formName });
      }
      onClose();
      fetchGroups(page, search);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadGroupStudents = useCallback(
    async (groupId: number) => {
      setIsStudentsLoading(true);
      try {
        const { data } = await groupsApi.getGroupStudents(groupId);
        const combined = Array.isArray(data.students) ? data.students : [];
        let normalized = combined
          .map((student) => normalizeGroupStudent(student))
          .filter((student) => student.isEnrolled);

        if (normalized.length === 0) {
          const fallbackSource = Array.isArray(data.enrolledStudents)
            ? data.enrolledStudents
            : Array.isArray(data.enrolled)
            ? data.enrolled
            : [];
          normalized = fallbackSource.map((student) =>
            normalizeGroupStudent(student, { isEnrolled: true })
          );
        }

        setGroupStudents(normalized);
        setGroupInfo(normalizeGroupInfo(data.groupInfo));
        setSelectedStudentIds([]);
      } catch (err: any) {
        toast.error(err.response?.data?.message ?? err.message ?? "خطا در دریافت دانشجویان");
        setGroupStudents([]);
        setGroupInfo(null);
      } finally {
        setIsStudentsLoading(false);
      }
    },
    []
  );

  const openManageStudents = async (group: Group) => {
    setSelectedGroup(group);
    setBulkUsernames("");
    setStudentSearch("");
    await loadGroupStudents(group.id);
    onManageStudentsOpen();
  };

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return groupStudents;
    return groupStudents.filter((student) => student.username.toLowerCase().includes(term));
  }, [groupStudents, studentSearch]);

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleRemoveStudents = async () => {
    if (!selectedGroup || selectedStudentIds.length === 0) return;
    try {
      await groupsApi.removeStudentsFromGroup(selectedGroup.id, selectedStudentIds);
      toast.success("دانشجویان انتخاب‌شده از گروه حذف شدند");
      await loadGroupStudents(selectedGroup.id);
      fetchGroups(page, search);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message ?? "خطا در حذف دانشجویان");
    }
  };

  const parseUsernames = (value: string) =>
    Array.from(
      new Set(
        value
          .split(/\s|,|;|\n/) // split by whitespace, comma, semicolon, newline
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

  const handleBulkAddStudents = async () => {
    if (!selectedGroup) return;
    const usernames = parseUsernames(bulkUsernames);
    if (usernames.length === 0) {
      toast.warning("لطفاً حداقل یک نام کاربری معتبر وارد کنید");
      return;
    }

    try {
      const { data } = await groupsApi.addStudentsToGroupByUsername(selectedGroup.id, usernames);
      const successCount = data.successful?.length ?? 0;
      const errorCount = data.errors?.length ?? 0;

      if (successCount > 0) {
        toast.success(`${successCount} دانشجو با موفقیت به گروه اضافه شد`);
      }

      if (errorCount > 0) {
        data.errors?.forEach(({ username, reason }) => {
          toast.error(`${username}: ${reason}`);
        });
      }

      setBulkUsernames("");
      await loadGroupStudents(selectedGroup.id);
      fetchGroups(page, search);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message ?? "خطا در افزودن دانشجویان");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این گروه اطمینان دارید؟")) return;
    try {
      await groupsApi.deleteGroup(id);
      fetchGroups(page, search);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مدیریت گروه‌ها</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            {groups.length} گروه ثبت شده
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={openCreate}
        >
          افزودن گروه
        </Button>
      </div>
      <Card className="border border-neutral-200/50 dark:border-neutral-800/50">
        <CardBody className="p-0">
          <div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
            <Input
              placeholder="جستجو در گروه‌ها..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              startContent={<Search className="w-4 h-4 text-neutral-500" />}
              className="w-full sm:w-72"
              aria-label="جستجو در گروه‌ها"
            />
          </div>
              <Table aria-label="لیست گروه‌ها">
                <TableHeader>
                  <TableColumn>نام گروه</TableColumn>
                  <TableColumn>عملیات</TableColumn>
                </TableHeader>
            <TableBody emptyContent="گروهی یافت نشد">
              {groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{g.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onClick={() => openManageStudents(g)}
                      >
                        مدیریت دانشجویان
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onClick={() => openEdit(g)}
                      >
                        ویرایش
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onClick={() => handleDelete(g.id)}
                      >
                        حذف
                      </Button>
                    </div>
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
          onChange={(p) => setPage(p)}
          aria-label="صفحه‌بندی گروه‌ها"
        />
      </div>
      {error && (
        <div className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-4 rounded-xl shadow-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingId ? "ویرایش گروه" : "افزودن گروه جدید"}
              </ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  label="نام گروه"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  انصراف
                </Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isDisabled={!formName.trim()}
                >
                  ذخیره
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isManageStudentsOpen}
        onClose={onManageStudentsClose}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">مدیریت دانشجویان</h3>
                    <p className="text-sm text-neutral-500">
                      {selectedGroup?.name ?? ""}
                    </p>
                  </div>
                  <Chip color="primary" variant="flat">
                    {groupInfo?.currentEnrollment ?? groupStudents.length} دانشجو
                  </Chip>
                </div>
              </ModalHeader>
              <ModalBody className="gap-6">
                <Card>
                  <CardBody className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">دانشجویان گروه</span>
                        <Chip size="sm" variant="flat" color="primary">
                          {filteredStudents.length} مورد
                        </Chip>
                      </div>
                      <Input
                        placeholder="جستجو بر اساس نام کاربری..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        startContent={<Search className="w-4 h-4 text-neutral-500" />}
                        aria-label="جستجوی دانشجو در گروه"
                      />
                    </div>
                    <div className="max-h-[260px] overflow-y-auto border border-neutral-200/60 dark:border-neutral-800/60 rounded-lg">
                      <Table removeWrapper aria-label="لیست دانشجویان گروه">
                        <TableHeader>
                          <TableColumn className="w-16">انتخاب</TableColumn>
                          <TableColumn>نام کاربری</TableColumn>
                          <TableColumn>وضعیت</TableColumn>
                        </TableHeader>
                        <TableBody
                          emptyContent={
                            isStudentsLoading ? "در حال بارگذاری..." : "دانشجویی یافت نشد"
                          }
                        >
                          {filteredStudents.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <Checkbox
                                  isSelected={selectedStudentIds.includes(student.id)}
                                  onValueChange={() => toggleStudentSelection(student.id)}
                                  isDisabled={!student.isEnrolled}
                                  aria-label={`انتخاب ${student.username}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{student.username}</TableCell>
                              <TableCell>
                                <Chip
                                  size="sm"
                                  color={student.isEnrolled ? "success" : "default"}
                                  variant="flat"
                                >
                                  {student.isEnrolled ? "عضو گروه" : "غیرفعال"}
                                </Chip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        color="danger"
                        variant="flat"
                        onPress={handleRemoveStudents}
                        isDisabled={selectedStudentIds.length === 0}
                      >
                        حذف دانشجویان انتخاب‌شده
                      </Button>
                    </div>
                  </CardBody>
                </Card>
                <Divider />
                <Card>
                  <CardBody className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-semibold">افزودن گروهی دانشجویان</span>
                      </div>
                    </div>
                    <Textarea
                      minRows={4}
                      placeholder="نام‌های کاربری را با فاصله، ویرگول یا خط جدید جدا کنید"
                      value={bulkUsernames}
                      onChange={(e) => setBulkUsernames(e.target.value)}
                      aria-label="ورود گروهی نام کاربری دانشجویان"
                    />
                    <p className="text-xs text-neutral-500">
                      مثال: <span className="font-mono">student1 student2 student3</span>
                    </p>
                    <div className="flex justify-end">
                      <Button
                        color="primary"
                        onPress={handleBulkAddStudents}
                        isDisabled={bulkUsernames.trim().length === 0}
                      >
                        افزودن دانشجویان
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
    </div>
  );
}
