"use client";

import { useUsers } from "@/hooks/useUsers";
import { User } from "@/types/user";
import {
	Button,
	Input,
	Pagination,
	Select,
	SelectItem,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@nextui-org/react";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { defaultStyles, roleConfig } from "./styles";

interface UsersTableProps {
	initialData: User[];
	onAddUser: () => void;
	onEditUser: (user: User) => void;
	onDeleteUser: (id: number) => Promise<void>;
	styles?: typeof defaultStyles;
}

export function UsersTable({
	initialData = [],
	onAddUser,
	onEditUser,
	onDeleteUser,
	styles = defaultStyles,
}: UsersTableProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRole, setSelectedRole] = useState<
		"" | "admin" | "teacher" | "student"
	>("");
	const searchTimeout = useRef<NodeJS.Timeout>();

	const { users, totalPages, loading, error, filters, fetchUsers } = useUsers({
		page: 1,
		limit: 10,
		search: "",
		initialData,
	});

	// Only fetch when user explicitly searches or filters
	useEffect(() => {
		if (searchTimeout.current) {
			clearTimeout(searchTimeout.current);
		}

		searchTimeout.current = setTimeout(() => {
			// Only include search and role in filters if they have values
			const newFilters: Partial<UserFilters> = {
				page: 1,
			};

			if (searchQuery.trim()) {
				newFilters.search = searchQuery;
			}

			if (selectedRole) {
				newFilters.role = selectedRole;
			}

			fetchUsers(newFilters);
		}, 500);

		return () => {
			if (searchTimeout.current) {
				clearTimeout(searchTimeout.current);
			}
		};
	}, [searchQuery, selectedRole]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
	};

	const handleRoleChange = (value: "" | "admin" | "teacher" | "student") => {
		setSelectedRole(value);
	};

	const handlePageChange = useCallback(
		(page: number) => {
			fetchUsers({ page });
		},
		[fetchUsers]
	);

	const handleDeleteUser = useCallback(
		async (id: number) => {
			if (window.confirm("آیا از حذف این کاربر اطمینان دارید؟")) {
				await onDeleteUser(id);
			}
		},
		[onDeleteUser]
	);

	const tableItems = useCallback(() => {
		if (!Array.isArray(users) || users.length === 0) {
			return [];
		}

		return users.map((user) => ({
			key: user.id,
			id: (
				<div className={styles.idBadge}>
					#{String(user.id).padStart(4, "0")}
				</div>
			),
			username: user.username,
			role: (() => {
				const role = roleConfig[user.role];
				const RoleIcon = role.icon;
				const badgeStyle = styles.badgeStyles[user.role];
				return (
					<div className={badgeStyle.base}>
						<RoleIcon className={badgeStyle.icon} />
						<span>{role.label}</span>
					</div>
				);
			})(),
			actions: (
				<div className="flex gap-2">
					<Button
						className={styles.buttonStyles.secondary}
						onClick={() => onEditUser(user)}
						startContent={<Edit className="w-4 h-4" />}>
						ویرایش
					</Button>
					<Button
						className={styles.buttonStyles.danger}
						onClick={() => handleDeleteUser(user.id)}
						startContent={<Trash2 className="w-4 h-4" />}>
						حذف
					</Button>
				</div>
			),
		}));
	}, [users, onEditUser, handleDeleteUser, styles]);

	if (loading && !users.length) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-red-500 text-center py-4">
				{error}
				<Button className="ml-4" onClick={() => fetchUsers()}>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center gap-4 px-2">
				<div className="flex items-center gap-4 flex-1">
					<Input
						placeholder="جستجوی کاربر..."
						value={searchQuery}
						onChange={(e) => handleSearchChange(e.target.value)}
						startContent={<Search className="w-4 h-4 text-primary-500" />}
						className="w-72"
						classNames={{
							inputWrapper: styles.search,
						}}
					/>
					<Select
						placeholder="فیلتر بر اساس نقش"
						selectedKeys={selectedRole ? [selectedRole] : []}
						onChange={(e) =>
							handleRoleChange(
								e.target.value as "" | "admin" | "teacher" | "student"
							)
						}
						className="w-48"
						size="sm">
						<SelectItem key="" value="">
							همه
						</SelectItem>
						{
							Object.entries(roleConfig).map(([key, config]) => (
								<SelectItem
									key={key}
									value={key}
									startContent={<config.icon className="w-4 h-4" />}>
									{config.label}
								</SelectItem>
							)) as any
						}
					</Select>
				</div>
				<Button
					className={`${styles.buttonStyles.primary} h-12 px-6`}
					onClick={onAddUser}
					startContent={<Plus className="w-4 h-4" />}>
					افزودن کاربر
				</Button>
			</div>

			<Table
				aria-label="Users table"
				classNames={{
					wrapper: styles.wrapper,
					th: styles.th,
					td: styles.td,
				}}>
				<TableHeader>
					<TableColumn>شناسه</TableColumn>
					<TableColumn>نام کاربری</TableColumn>
					<TableColumn>نقش</TableColumn>
					<TableColumn>عملیات</TableColumn>
				</TableHeader>
				<TableBody
					items={tableItems() || []} // Ensure we always have an array
					emptyContent="هیچ کاربری یافت نشد"
					loadingContent={
						<div className="flex justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
						</div>
					}
					loadingState={loading ? "loading" : "idle"}>
					{(item) => (
						<TableRow key={item.key}>
							<TableCell>{item.id}</TableCell>
							<TableCell>{item.username}</TableCell>
							<TableCell>{item.role}</TableCell>
							<TableCell>{item.actions}</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{totalPages > 1 && (
				<Pagination
					total={totalPages}
					page={filters.page}
					onChange={handlePageChange}
					className="flex justify-center"
				/>
			)}
		</div>
	);
}
