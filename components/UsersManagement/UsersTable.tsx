"use client";

import { useUsers } from "@/hooks/useUsers";
import { api } from "@/lib/api";
import { User, UserFilters } from "@/lib/types/common";
import {
	Button,
	Checkbox,
	Chip,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Pagination,
	Progress,
	Select,
	SelectItem,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@nextui-org/react";
import {
	Edit,
	GraduationCap,
	Plus,
	School,
	Search,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import {
	AwaitedReactNode,
	JSXElementConstructor,
	ReactElement,
	ReactNode,
	ReactPortal,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { defaultStyles } from "./styles";

interface RoleConfig {
	icon: React.ComponentType<any>;
	label: string;
}

const roleConfig: Record<"admin" | "teacher" | "student", RoleConfig> = {
	admin: {
		icon: ShieldCheck,
		label: "مدیر سیستم",
	},
	teacher: {
		icon: School,
		label: "استاد",
	},
	student: {
		icon: GraduationCap,
		label: "دانشجو",
	},
};

interface ExcelUploadResponse {
	users: Array<{
		id: number;
		username: string;
		firstName: string;
		lastName: string;
	}>;
	errors: string[];
	duplicates: Array<{
		username: string;
		firstName: string;
		lastName: string;
		message: string;
	}>;
	reactivated: Array<{
		username: string;
		firstName: string;
		lastName: string;
	}>;
}

interface UsersTableProps {
	initialData: User[];
	onAddUser: () => void;
	onEditUser: (user: User) => void;
	onDeleteUser: (id: number) => Promise<void>;
	onDeleteMultipleUsers: (ids: number[]) => Promise<void>;
	styles?: typeof defaultStyles;
}

export function UsersTable({
	initialData = [],
	onAddUser,
	onEditUser,
	onDeleteUser,
	onDeleteMultipleUsers,
	styles = defaultStyles,
}: UsersTableProps) {
        const [searchQuery, setSearchQuery] = useState("");
        const [selectedRole, setSelectedRole] = useState<
                "" | "admin" | "teacher" | "student"
        >("");
        const [groupQuery, setGroupQuery] = useState("");
        const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
        const [selectAll, setSelectAll] = useState(false);
        const searchTimeout = useRef<NodeJS.Timeout>();

        const {
                users,
                totalPages,
                totalItems,
                loading,
                error: fetchError,
                filters,
                fetchUsers,
        } = useUsers({
		page: 1,
		limit: 10,
		search: "",
		initialData,
	});

	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadResponse, setUploadResponse] =
		useState<ExcelUploadResponse | null>(null);
	const [isUploadExcelOpen, setIsUploadExcelOpen] = useState(false);

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("file", file);

		setIsUploading(true);
		setUploadProgress(0);

		try {
			const response = await api.uploadUsersExcel(formData);
			setUploadResponse(response.data);

			// Show success messages
			if (response.data.reactivated.length > 0) {
				toast.success(
					`${response.data.reactivated.length} کاربر با موفقیت فعال شد`
				);
			}

			// Show warnings for duplicates
			if (response.data.duplicates.length > 0) {
				response.data.duplicates.forEach(
					(duplicate: { username: any; message: any }) => {
						toast.warning(`${duplicate.username}: ${duplicate.message}`);
					}
				);
			}

			// Show errors if any
			if (response.data.errors.length > 0) {
				response.data.errors.forEach(
					(
						error:
							| string
							| number
							| bigint
							| boolean
							| ReactElement<any, string | JSXElementConstructor<any>>
							| Iterable<ReactNode>
							| ReactPortal
							| Promise<AwaitedReactNode>
							| (() => React.ReactNode)
							| null
							| undefined
					) => {
						toast.error(error);
					}
				);
			}

			// Refresh users list if any changes were made
			if (
				response.data.reactivated.length > 0 ||
				response.data.users.length > 0
			) {
				fetchUsers(filters);
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				setError(error.message);
				toast.error(error.message);
			}
		} finally {
			setIsUploading(false);
		}
	};

        useEffect(() => {
                if (searchTimeout.current) {
                        clearTimeout(searchTimeout.current);
                }

                searchTimeout.current = setTimeout(() => {
                        const newFilters: Partial<UserFilters> = {
                                page: 1,
                        };

                        if (searchQuery.trim()) {
                                newFilters.search = searchQuery;
                        }

                        if (selectedRole) {
                                newFilters.role = selectedRole;
                        }

                        if (groupQuery.trim()) {
                                newFilters.groupId = groupQuery;
                        }

                        fetchUsers(newFilters);
                }, 500);

                return () => {
                        if (searchTimeout.current) {
                                clearTimeout(searchTimeout.current);
                        }
                };
        }, [searchQuery, selectedRole, groupQuery]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
	};

        const handleRoleChange = (value: "" | "admin" | "teacher" | "student") => {
                setSelectedRole(value);
        };

        const handleGroupChange = (value: string) => {
                setGroupQuery(value);
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

	const handleUserSelection = (userId: number) => {
		setSelectedUsers((prevSelected) =>
			prevSelected.includes(userId)
				? prevSelected.filter((id) => id !== userId)
				: [...prevSelected, userId]
		);
	};

	const handleSelectAll = () => {
		if (selectAll) {
			setSelectedUsers([]);
		} else {
			setSelectedUsers(users.map((user) => user.id));
		}
		setSelectAll(!selectAll);
	};

	const handleDeleteSelectedUsers = async () => {
		if (window.confirm("آیا از حذف این کاربران اطمینان دارید؟")) {
			await onDeleteMultipleUsers(selectedUsers);
			setSelectedUsers([]);
			setSelectAll(false);
		}
	};

	const tableItems = useCallback(() => {
		if (!Array.isArray(users) || users.length === 0) {
			return [];
		}

                return users.map((user) => ({
                        key: user.id,
                        fullName: `${user.firstName} ${user.lastName}`,
                        username: user.username,
                        group: user.groupName || "-",
                        role: (() => {
                                const role = roleConfig[user.role as "admin" | "teacher" | "student"];
                                const RoleIcon = role.icon;
                                const badgeStyle =
                                        styles.badgeStyles[user.role as "admin" | "teacher" | "student"];
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
        }, [
                users,
                onEditUser,
                handleDeleteUser,
                styles,
        ]);

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
                                       <Input
                                                placeholder="شماره گروه"
                                                value={groupQuery}
                                                onChange={(e) => handleGroupChange(e.target.value)}
                                                className="w-40"
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
                                       <span className="text-sm text-neutral-600">
                                                تعداد کل: {totalItems}
                                        </span>
                               </div>
                               <div className="flex gap-2">
				
					<Button
						className={`${styles.buttonStyles.danger} h-12 px-6`}
						onClick={handleDeleteSelectedUsers}
						isDisabled={selectedUsers.length === 0}
						startContent={<Trash2 className="w-4 h-4" />}>
						حذف کاربران انتخاب شده
					</Button>
				</div>
			</div>

			<Table
				aria-label="Users table"
				classNames={{
					wrapper: styles.wrapper,
					th: styles.th,
					td: styles.td,
				}}>
                                <TableHeader>
                                        <TableColumn>
                                                <Checkbox isSelected={selectAll} onValueChange={handleSelectAll} />
                                        </TableColumn>
                                        <TableColumn>نام و نام خانوادگی</TableColumn>
                                        <TableColumn>نام کاربری</TableColumn>
                                        <TableColumn>نام گروه</TableColumn>
                                        <TableColumn>نقش</TableColumn>
                                        <TableColumn>عملیات</TableColumn>
                                </TableHeader>
				<TableBody
					items={tableItems() || []}
					emptyContent="هیچ کاربری یافت نشد"
					loadingContent={
						<div className="flex justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
						</div>
					}
					loadingState={loading ? "loading" : "idle"}>
					{(item) => (
                                                <TableRow key={item.key}>
                                                        <TableCell>
                                                                <Checkbox
                                                                        isSelected={selectedUsers.includes(item.key)}
                                                                        onValueChange={() => handleUserSelection(item.key)}
                                                                />
                                                        </TableCell>
                                                        <TableCell>{item.fullName}</TableCell>
                                                        <TableCell>{item.username}</TableCell>
                                                        <TableCell>{item.group}</TableCell>
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

			<Modal
				isOpen={isUploadExcelOpen}
				onClose={() => {
					setIsUploadExcelOpen(false);
					setUploadResponse(null);
					setError(null);
				}}
				size="3xl">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<h3 className="text-lg font-bold">آپلود فایل اکسل</h3>
								<p className="text-sm text-neutral-500">
									{uploadResponse
										? "نتایج بررسی فایل"
										: "لطفا فایل اکسل حاوی اطلاعات کاربران را انتخاب کنید"}
								</p>
							</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									{!uploadResponse && (
										<div className="flex flex-col gap-4">
											<Input
												type="file"
												accept=".xlsx,.xls,.csv"
												onChange={handleFileUpload}
												disabled={isUploading}
												className="mb-4"
											/>
											{isUploading && (
												<Progress
													value={uploadProgress}
													color="primary"
													label="در حال آپلود..."
													showValueLabel={true}
													className="my-4"
												/>
											)}
										</div>
									)}

									{uploadResponse && (
										<div className="space-y-6">
											{uploadResponse.duplicates.length > 0 && (
												<div>
													<h4 className="text-lg font-bold text-warning mb-2">
														کاربران تکراری
													</h4>
													<Table aria-label="کاربران تکراری">
														<TableHeader>
															<TableColumn>نام کاربری</TableColumn>
															<TableColumn>نام</TableColumn>
															<TableColumn>نام خانوادگی</TableColumn>
															<TableColumn>وضعیت</TableColumn>
														</TableHeader>
														<TableBody>
															{uploadResponse.duplicates.map((user, index) => (
																<TableRow key={index}>
																	<TableCell>{user.username}</TableCell>
																	<TableCell>{user.firstName}</TableCell>
																	<TableCell>{user.lastName}</TableCell>
																	<TableCell>
																		<Chip
																			color="warning"
																			variant="flat"
																			size="sm">
																			{user.message}
																		</Chip>
																	</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											)}

											{uploadResponse.reactivated.length > 0 && (
												<div>
													<h4 className="text-lg font-bold text-success mb-2">
														کاربران فعال شده
													</h4>
													<Table aria-label="کاربران فعال شده">
														<TableHeader>
															<TableColumn>نام کاربری</TableColumn>
															<TableColumn>نام</TableColumn>
															<TableColumn>نام خانوادگی</TableColumn>
														</TableHeader>
														<TableBody>
															{uploadResponse.reactivated.map((user, index) => (
																<TableRow key={index}>
																	<TableCell>{user.username}</TableCell>
																	<TableCell>{user.firstName}</TableCell>
																	<TableCell>{user.lastName}</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											)}

											{uploadResponse.errors.length > 0 && (
												<div className="bg-danger-50 p-4 rounded-lg">
													<h4 className="text-lg font-bold text-danger mb-2">
														خطاها
													</h4>
													<ul className="list-disc list-inside text-danger">
														{uploadResponse.errors.map((error, index) => (
															<li key={index}>{error}</li>
														))}
													</ul>
												</div>
											)}
										</div>
									)}
								</div>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									بستن
								</Button>
								{uploadResponse && (
									<Button
										color="success"
										onPress={() => {
											fetchUsers(filters);
											onClose();
										}}>
										تایید و به روزرسانی
									</Button>
								)}
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
