"use client";

import { useEffect, useState, FormEvent } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [manualUser, setManualUser] = useState({
    username: "",
    password: "",
    role: "student",
  });
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const router = useRouter();

  // دریافت لیست کاربران
  const fetchUsers = async () => {
    try {
      const { data } = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("خطا در دریافت کاربران");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // تغییر نقش کاربر
  const handleRoleChange = async (id: number, newRole: string) => {
    try {
      await api.updateUserRole(id, newRole);
      setUsers(
        users.map((user) =>
          user.id === id ? { ...user, role: newRole } : user
        )
      );
      setSuccess("نقش کاربر تغییر کرد");
      setError("");
    } catch (err) {
      setError("خطا در تغییر نقش کاربر");
      setSuccess("");
    }
  };

  // حذف کاربر
  const handleDeleteUser = async (id: number) => {
    try {
      await api.deleteUser(id);
      setUsers(users.filter((user) => user.id !== id));
      setSuccess("کاربر حذف شد");
      setError("");
    } catch (err) {
      setError("خطا در حذف کاربر");
      setSuccess("");
    }
  };

  // ایجاد کاربر دستی
  const handleCreateUserManual = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createUserManual(
        manualUser.username,
        manualUser.password,
        manualUser.role
      );
      setSuccess("کاربر با موفقیت ایجاد شد");
      setError("");
      setManualUser({ username: "", password: "", role: "student" });
      fetchUsers();
    } catch (err) {
      setError("خطا در ایجاد کاربر");
      setSuccess("");
    }
  };

  // آپلود فایل اکسل جهت وارد کردن کاربران
  const handleExcelUpload = async () => {
    if (!excelFile) {
      setError("لطفاً فایل اکسل را انتخاب کنید");
      return;
    }
    const formData = new FormData();
    formData.append("file", excelFile);
    try {
      const { data } = await api.uploadUsersExcel(formData);
      setSuccess(data.message);
      setError("");
      setExcelFile(null);
      fetchUsers();
    } catch (err) {
      setError("خطا در آپلود فایل اکسل");
      setSuccess("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-2xl font-bold">ایجاد کاربر جدید</h2>
          <form onSubmit={handleCreateUserManual} className="space-y-4">
            <Input
              label="نام کاربری"
              placeholder="نام کاربری را وارد کنید"
              value={manualUser.username}
              onChange={(e) => setManualUser({ ...manualUser, username: e.target.value })}
              required
            />
            <Input
              label="رمز عبور"
              type="password"
              placeholder="رمز عبور را وارد کنید"
              value={manualUser.password}
              onChange={(e) => setManualUser({ ...manualUser, password: e.target.value })}
              required
            />
            <Select
              label="نقش کاربر"
              value={manualUser.role}
              onChange={(e) => setManualUser({ ...manualUser, role: e.target.value })}
            >
              <SelectItem value="student">دانشجو</SelectItem>
              <SelectItem value="teacher">استاد</SelectItem>
              <SelectItem value="admin">مدیر کل</SelectItem>
            </Select>
            <Button type="submit" color="primary" className="w-full">
              ایجاد کاربر
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Table aria-label="لیست کاربران">
            <TableHeader>
              <TableColumn>شناسه</TableColumn>
              <TableColumn>نام کاربری</TableColumn>
              <TableColumn>نقش</TableColumn>
              <TableColumn>عملیات</TableColumn>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <SelectItem value="student">دانشجو</SelectItem>
                      <SelectItem value="teacher">استاد</SelectItem>
                      <SelectItem value="admin">مدیر کل</SelectItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      حذف
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
