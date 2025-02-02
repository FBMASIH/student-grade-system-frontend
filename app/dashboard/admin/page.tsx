"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AdminDashboard() {
	const [users, setUsers] = useState<any[]>([]);

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const { data } = await api.getUsers();
				setUsers(data);
			} catch (err) {
				console.error("خطا در دریافت کاربران", err);
			}
		};
		fetchUsers();
	}, []);

	const handleRoleChange = async (id: string, newRole: string) => {
		try {
			await api.updateUserRole(id, newRole);
			setUsers(
				users.map((user) =>
					user.id === id ? { ...user, role: newRole } : user
				)
			);
		} catch (err) {
			console.error("خطا در تغییر نقش", err);
		}
	};

	const handleDeleteUser = async (id: string) => {
		try {
			await api.deleteUser(id);
			setUsers(users.filter((user) => user.id !== id));
		} catch (err) {
			console.error("خطا در حذف کاربر", err);
		}
	};

	return (
		<div className="p-6 bg-white rounded-lg shadow-md">
			<h1 className="text-2xl font-bold text-blue-600">پنل مدیریت کاربران</h1>
			<table className="w-full mt-4 border-collapse">
				<thead>
					<tr className="bg-gray-200">
						<th className="border p-2">نام کاربری</th>
						<th className="border p-2">نقش</th>
						<th className="border p-2">عملیات</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr key={user.id} className="border">
							<td className="p-2 border">{user.username}</td>
							<td className="p-2 border">
								<select
									value={user.role}
									onChange={(e) => handleRoleChange(user.id, e.target.value)}
									className="p-1 border rounded">
									<option value="student">دانشجو</option>
									<option value="teacher">استاد</option>
									<option value="admin">مدیر کل</option>
								</select>
							</td>
							<td className="p-2 border">
								<button
									className="bg-red-500 text-white px-3 py-1 rounded"
									onClick={() => handleDeleteUser(user.id)}>
									حذف
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
