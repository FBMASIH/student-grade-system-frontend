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
  firstName?: string;
  lastName?: string;
  fullName?: string;
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

interface StudentLike {
  id?: number | string | null;
  username?: string | null;
  userName?: string | null;
  user_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  studentId?: number | string | null;
  student_id?: number | string | null;
  userId?: number | string | null;
  user_id?: number | string | null;
  memberId?: number | string | null;
  member_id?: number | string | null;
  personId?: number | string | null;
  person_id?: number | string | null;
  accountId?: number | string | null;
  account_id?: number | string | null;
  isEnrolled?: boolean | string | number | null;
  canEnroll?: boolean | string | number | null;
  is_enrolled?: boolean | string | number | null;
  can_enroll?: boolean | string | number | null;
  enrollmentStatus?: string | null;
  enrollment_status?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

interface RawGroupStudent extends StudentLike {
  student?: StudentLike | null;
  user?: StudentLike | null;
  profile?: StudentLike | null;
  account?: StudentLike | null;
  member?: StudentLike | null;
  details?: StudentLike | null;
  person?: StudentLike | null;
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

type EnrollmentResult = {
  successful?: Array<{ username: string }>;
  errors?: Array<{ username: string; reason: string }>;
};

const STATUS_ENROLLED_VALUES = new Set([
  "enrolled",
  "member",
  "registered",
  "joined",
  "active",
]);

const STATUS_ELIGIBLE_VALUES = new Set([
  "can_enroll",
  "available",
  "eligible",
  "pending",
  "pending_enrollment",
  "waitlisted",
]);

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseFlexibleBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "n", "off"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
};

const gatherStudentCandidates = (student: RawGroupStudent): StudentLike[] => {
  const stack: Array<StudentLike | null | undefined> = [student];
  const collected: StudentLike[] = [];
  const visited = new Set<StudentLike>();
  const nestedKeys: Array<keyof StudentLike> = [
    "student",
    "user",
    "profile",
    "account",
    "member",
    "details",
    "person",
  ];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);
    collected.push(current);

    for (const key of nestedKeys) {
      const nested = current[key];
      if (nested && typeof nested === "object") {
        stack.push(nested as StudentLike);
      }
    }
  }

  return collected;
};

const resolveStatusValue = (student: RawGroupStudent) => {
  for (const candidate of gatherStudentCandidates(student)) {
    const rawStatus =
      candidate.enrollmentStatus ??
      candidate.enrollment_status ??
      (typeof candidate.status === "string" ? candidate.status : undefined);

    if (typeof rawStatus === "string" && rawStatus.trim().length > 0) {
      return rawStatus.trim().toLowerCase();
    }
  }

  return "";
};

const resolveNameParts = (
  student: RawGroupStudent
): { firstName?: string; lastName?: string; fullName?: string } => {
  let firstName: string | undefined;
  let lastName: string | undefined;
  let explicitFullName: string | undefined;

  for (const candidate of gatherStudentCandidates(student)) {
    if (!firstName) {
      firstName =
        toNonEmptyString(candidate.firstName) ??
        toNonEmptyString(candidate.first_name);
    }

    if (!lastName) {
      lastName =
        toNonEmptyString(candidate.lastName) ??
        toNonEmptyString(candidate.last_name);
    }

    if (!explicitFullName) {
      explicitFullName =
        toNonEmptyString(candidate.fullName) ??
        toNonEmptyString(candidate.full_name);
    }

    if (firstName && lastName && explicitFullName) {
      break;
    }
  }

  if ((!firstName || !lastName) && explicitFullName) {
    const parts = explicitFullName.split(/\s+/).filter(Boolean);
    if (!firstName && parts.length > 0) {
      firstName = parts.shift();
    }
    if (!lastName && parts.length > 0) {
      lastName = parts.join(" ") || undefined;
    }
  }

  const fullName =
    explicitFullName ||
    [firstName, lastName]
      .filter((value): value is string => Boolean(value))
      .join(" ") ||
    undefined;

  return { firstName, lastName, fullName };
};

const resolveBooleanFlag = (
  student: RawGroupStudent,
  keys: Array<keyof StudentLike>
): boolean | undefined => {
  for (const candidate of gatherStudentCandidates(student)) {
    for (const key of keys) {
      const parsed = parseFlexibleBoolean(candidate[key]);
      if (typeof parsed === "boolean") {
        return parsed;
      }
    }
  }

  return undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const resolveStudentId = (student: RawGroupStudent): number | undefined => {
  for (const candidate of gatherStudentCandidates(student)) {
    const potentialValues = [
      candidate.id,
      candidate.studentId,
      candidate.student_id,
      candidate.userId,
      candidate.user_id,
      candidate.memberId,
      candidate.member_id,
      candidate.personId,
      candidate.person_id,
      candidate.accountId,
      candidate.account_id,
    ];

    for (const value of potentialValues) {
      const numeric = toOptionalNumber(value);
      if (typeof numeric === "number") {
        return numeric;
      }
    }
  }

  return undefined;
};

const resolveUsername = (student: RawGroupStudent): string => {
  for (const candidate of gatherStudentCandidates(student)) {
    const username =
      toNonEmptyString(candidate.username) ??
      toNonEmptyString(candidate.userName) ??
      toNonEmptyString(candidate.user_name);

    if (username) {
      return username;
    }
  }

  return "";
};

const FALLBACK_ID_OFFSET = 1_000_000_000;
let fallbackIdSequence = 0;

const generateFallbackId = (username: string) => {
  if (username) {
    let hash = 0;
    for (let index = 0; index < username.length; index += 1) {
      hash = (hash << 5) - hash + username.charCodeAt(index);
      hash |= 0;
    }
    return FALLBACK_ID_OFFSET + Math.abs(hash) + username.length;
  }

  fallbackIdSequence += 1;
  return FALLBACK_ID_OFFSET + fallbackIdSequence;
};

const normalizeGroupStudent = (
  student: RawGroupStudent,
  overrides?: { isEnrolled?: boolean; canEnroll?: boolean }
): GroupStudent => {
  const statusValue = resolveStatusValue(student);
  const statusIndicatesEnrollment = STATUS_ENROLLED_VALUES.has(statusValue);
  const statusIndicatesEligibility = STATUS_ELIGIBLE_VALUES.has(statusValue);

  const booleanIsEnrolled = resolveBooleanFlag(student, [
    "isEnrolled",
    "is_enrolled",
  ]);
  const booleanCanEnroll = resolveBooleanFlag(student, [
    "canEnroll",
    "can_enroll",
  ]);

  const resolvedIsEnrolled =
    typeof overrides?.isEnrolled === "boolean"
      ? overrides.isEnrolled
      : typeof booleanIsEnrolled === "boolean"
      ? booleanIsEnrolled
      : statusIndicatesEnrollment;

  const candidateCanEnroll =
    typeof overrides?.canEnroll === "boolean"
      ? overrides.canEnroll
      : typeof booleanCanEnroll === "boolean"
      ? booleanCanEnroll
      : statusIndicatesEligibility
      ? true
      : !resolvedIsEnrolled;

  const username = resolveUsername(student);
  const resolvedId = resolveStudentId(student);
  const { firstName, lastName, fullName } = resolveNameParts(student);

  return {
    id:
      typeof resolvedId === "number"
        ? resolvedId
        : generateFallbackId(username),
    username,
    firstName,
    lastName,
    fullName,
    isEnrolled: resolvedIsEnrolled,
    canEnroll: resolvedIsEnrolled ? false : candidateCanEnroll,
  };
};

const normalizeGroupInfo = (info?: RawGroupInfo | null): GroupInfo | null => {
  if (!info) return null;

  const toOptionalString = (value: unknown): string | undefined => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    if (value != null) {
      const casted = String(value).trim();
      return casted.length > 0 ? casted : undefined;
    }

    return undefined;
  };

  const groupNumberCandidate =
    info.groupNumber ??
    info.group_number ??
    (info as unknown as { groupNo?: number; group_no?: number })?.groupNo ??
    (info as unknown as { groupNo?: number; group_no?: number })?.group_no ??
    (info as unknown as { number?: number })?.number;

  const courseNameCandidate =
    info.courseName ??
    info.course_name ??
    (info as unknown as { course?: { name?: string } })?.course?.name ??
    (info as unknown as { name?: string })?.name;

  const capacityCandidate =
    info.capacity ??
    (info as unknown as { maxCapacity?: number; max_capacity?: number })?.maxCapacity ??
    (info as unknown as { maxCapacity?: number; max_capacity?: number })?.max_capacity ??
    (info as unknown as { limit?: number })?.limit;

  const currentEnrollmentCandidate =
    info.currentEnrollment ??
    info.current_enrollment ??
    (info as unknown as { currentMembers?: number })?.currentMembers ??
    (info as unknown as { membersCount?: number })?.membersCount ??
    (info as unknown as { totalEnrolled?: number })?.totalEnrolled;

  return {
    id: toOptionalNumber(info.id) ?? info.id,
    groupNumber: toOptionalNumber(groupNumberCandidate),
    courseName: toOptionalString(courseNameCandidate),
    capacity: toOptionalNumber(capacityCandidate),
    currentEnrollment: toOptionalNumber(currentEnrollmentCandidate),
  };
};

const studentCollator = new Intl.Collator("fa", { sensitivity: "base" });

const mergeGroupStudents = (students: GroupStudent[]): GroupStudent[] => {
  const map = new Map<string, GroupStudent>();

  for (const student of students) {
    const normalizedUsername = student.username.trim().toLowerCase();
    const key = normalizedUsername || `id-${student.id}`;
    const existing = map.get(key);

    if (existing) {
      const mergedIsEnrolled = existing.isEnrolled || student.isEnrolled;
      const mergedCanEnroll = mergedIsEnrolled
        ? false
        : existing.canEnroll || student.canEnroll;

      map.set(key, {
        ...existing,
        ...student,
        id: student.isEnrolled ? student.id : existing.id,
        isEnrolled: mergedIsEnrolled,
        canEnroll: mergedCanEnroll,
        firstName: existing.firstName ?? student.firstName,
        lastName: existing.lastName ?? student.lastName,
        fullName: existing.fullName ?? student.fullName,
      });
    } else {
      map.set(key, student);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.isEnrolled !== b.isEnrolled) {
      return a.isEnrolled ? -1 : 1;
    }

    const nameA = a.fullName ?? a.username;
    const nameB = b.fullName ?? b.username;
    return studentCollator.compare(nameA, nameB);
  });
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
  const [selectedForRemoval, setSelectedForRemoval] = useState<number[]>([]);
  const [selectedForAddition, setSelectedForAddition] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [bulkUsernames, setBulkUsernames] = useState("");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  const showEnrollmentFeedback = useCallback((result: EnrollmentResult) => {
    const successCount = result.successful?.length ?? 0;
    const errorCount = result.errors?.length ?? 0;

    if (successCount > 0) {
      toast.success(`${successCount} دانشجو با موفقیت به گروه اضافه شد`);
    }

    if (errorCount > 0) {
      result.errors?.forEach(({ username, reason }) => {
        toast.error(`${username}: ${reason}`);
      });
    }
  }, []);

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
        const aggregated: GroupStudent[] = [];

        const addStudentsFromSource = (
          source: unknown,
          overrides?: { isEnrolled?: boolean; canEnroll?: boolean }
        ) => {
          if (!Array.isArray(source)) {
            return;
          }

          source.forEach((student) => {
            if (!student || typeof student !== "object") {
              return;
            }

            const normalized = normalizeGroupStudent(
              student as RawGroupStudent,
              overrides
            );

            if (!normalized.username) {
              return;
            }

            aggregated.push(normalized);
          });
        };

        addStudentsFromSource(data.students);
        addStudentsFromSource((data as any)?.studentsList);
        addStudentsFromSource((data as any)?.students_list);
        addStudentsFromSource((data as any)?.allStudents);
        addStudentsFromSource(data.enrolledStudents, { isEnrolled: true });
        addStudentsFromSource(data.enrolled, { isEnrolled: true });
        addStudentsFromSource((data as any)?.registeredStudents, {
          isEnrolled: true,
        });
        addStudentsFromSource((data as any)?.registered, { isEnrolled: true });
        addStudentsFromSource((data as any)?.members, { isEnrolled: true });
        addStudentsFromSource((data as any)?.active, { isEnrolled: true });
        addStudentsFromSource(data.availableStudents, {
          isEnrolled: false,
          canEnroll: true,
        });
        addStudentsFromSource(data.available, {
          isEnrolled: false,
          canEnroll: true,
        });
        addStudentsFromSource((data as any)?.eligibleStudents, {
          isEnrolled: false,
          canEnroll: true,
        });
        addStudentsFromSource((data as any)?.eligible, {
          isEnrolled: false,
          canEnroll: true,
        });
        addStudentsFromSource((data as any)?.pending, {
          isEnrolled: false,
          canEnroll: true,
        });
        addStudentsFromSource((data as any)?.candidates, {
          isEnrolled: false,
          canEnroll: true,
        });

        const mergedStudents = mergeGroupStudents(aggregated);
        setGroupStudents(mergedStudents);

        const groupInfoSource =
          data.groupInfo ??
          (data as any)?.group ??
          (data as any)?.groupDetails ??
          (data as any)?.group_info ??
          null;

        setGroupInfo(normalizeGroupInfo(groupInfoSource));
        setSelectedForRemoval([]);
        setSelectedForAddition([]);
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
    return groupStudents.filter((student) => {
      const usernameMatch = student.username.toLowerCase().includes(term);
      const nameMatch = student.fullName?.toLowerCase().includes(term);
      return usernameMatch || nameMatch;
    });
  }, [groupStudents, studentSearch]);

  const enrolledCount = useMemo(
    () => groupStudents.filter((student) => student.isEnrolled).length,
    [groupStudents]
  );

  const groupDetails = useMemo(() => {
    if (!groupInfo) return "";

    const details: string[] = [];

    if (groupInfo.courseName) {
      details.push(`درس: ${groupInfo.courseName}`);
    }

    if (groupInfo.groupNumber != null) {
      details.push(`گروه ${groupInfo.groupNumber}`);
    }

    if (typeof groupInfo.capacity === "number") {
      details.push(`ظرفیت: ${groupInfo.capacity}`);
    }

    return details.join(" | ");
  }, [groupInfo]);

  const toggleStudentSelection = (student: GroupStudent) => {
    if (student.isEnrolled) {
      setSelectedForRemoval((prev) =>
        prev.includes(student.id)
          ? prev.filter((id) => id !== student.id)
          : [...prev, student.id]
      );

      if (!student.canEnroll) {
        setSelectedForAddition((prev) =>
          prev.filter((username) => username !== student.username)
        );
      }

      return;
    }

    if (student.canEnroll) {
      setSelectedForAddition((prev) =>
        prev.includes(student.username)
          ? prev.filter((username) => username !== student.username)
          : [...prev, student.username]
      );
    }
  };

  const isStudentSelected = (student: GroupStudent) => {
    if (student.isEnrolled) {
      return selectedForRemoval.includes(student.id);
    }

    if (student.canEnroll) {
      return selectedForAddition.includes(student.username);
    }

    return false;
  };

  const handleRemoveStudents = async () => {
    if (!selectedGroup || selectedForRemoval.length === 0) return;
    try {
      await groupsApi.removeStudentsFromGroup(selectedGroup.id, selectedForRemoval);
      toast.success("دانشجویان انتخاب‌شده از گروه حذف شدند");
      await loadGroupStudents(selectedGroup.id);
      fetchGroups(page, search);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message ?? "خطا در حذف دانشجویان");
    }
  };

  const handleAddSelectedStudents = async () => {
    if (!selectedGroup || selectedForAddition.length === 0) return;

    try {
      const { data } = await groupsApi.addStudentsToGroupByUsername(
        selectedGroup.id,
        selectedForAddition
      );
      showEnrollmentFeedback(data);

      setSelectedForAddition([]);
      await loadGroupStudents(selectedGroup.id);
      fetchGroups(page, search);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message ?? "خطا در افزودن دانشجویان");
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
      showEnrollmentFeedback(data);

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
                    {groupDetails && (
                      <p className="text-xs text-neutral-500">{groupDetails}</p>
                    )}
                  </div>
                  <Chip color="primary" variant="flat">
                    {groupInfo?.currentEnrollment ?? enrolledCount} دانشجو
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
                          <TableColumn>دانشجو</TableColumn>
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
                                  isSelected={isStudentSelected(student)}
                                  onValueChange={() => toggleStudentSelection(student)}
                                  isDisabled={!student.isEnrolled && !student.canEnroll}
                                  aria-label={`انتخاب ${student.username}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {student.fullName ?? student.username}
                                  </span>
                                  <span className="text-xs text-neutral-500">
                                    {student.username}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="sm"
                                  color={
                                    student.isEnrolled
                                      ? "success"
                                      : student.canEnroll
                                      ? "primary"
                                      : "default"
                                  }
                                  variant="flat"
                                >
                                  {student.isEnrolled
                                    ? "عضو گروه"
                                    : student.canEnroll
                                    ? "قابل ثبت‌نام"
                                    : "غیرفعال"}
                                </Chip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-neutral-500">
                        برای افزودن دانشجویان جدید، وضعیت «قابل ثبت‌نام» را انتخاب کنید.
                      </p>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={handleAddSelectedStudents}
                          isDisabled={selectedForAddition.length === 0}
                        >
                          افزودن دانشجویان انتخاب‌شده
                        </Button>
                        <Button
                          color="danger"
                          variant="flat"
                          onPress={handleRemoveStudents}
                          isDisabled={selectedForRemoval.length === 0}
                        >
                          حذف دانشجویان انتخاب‌شده
                        </Button>
                      </div>
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
