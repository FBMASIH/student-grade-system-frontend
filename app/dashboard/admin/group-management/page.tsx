"use client";

import { groupsApi } from "@/lib/api";
import { Group, PaginatedResponse } from "@/lib/types/common";
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
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@nextui-org/react";
import { AlertCircle, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formName, setFormName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

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
    </div>
  );
}
