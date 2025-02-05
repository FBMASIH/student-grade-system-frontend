"use client";

import { api } from "@/lib/api";
import {
	Button,
	Card,
	CardBody,
	Chip,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tabs,
	useDisclosure,
} from "@nextui-org/react";
import {
	AlertCircle,
	FileSpreadsheet,
	GraduationCap,
	Pencil,
	SchoolIcon,
	Search,
	ShieldCheck,
	Trash2,
	Upload,
	UserPlus,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { FormEvent, useEffect, useState } from "react";

const roleOptions = [
	{ label: "دانشجو", value: "student" },
	{ label: "استاد", value: "teacher" },
	{ label: "مدیر کل", value: "admin" },
];

const roleConfig = {
	student: {
		icon: GraduationCap,
		color: "blue", // NextUI color
		bgColor: "bg-blue-100 dark:bg-blue-900/20",
		textColor: "text-blue-600 dark:text-blue-400",
		label: "دانشجو",
	},
	teacher: {
		icon: SchoolIcon,
		color: "purple", // NextUI color
		bgColor: "bg-purple-100 dark:bg-purple-900/20",
		textColor: "text-purple-600 dark:text-purple-400",
		label: "استاد",
	},
	admin: {
		icon: ShieldCheck,
		color: "success", // NextUI color
		bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
		textColor: "text-emerald-600 dark:text-emerald-400",
		label: "مدیر",
	},
} as const;

interface User {
	id: number;
	username: string;
	role: "student" | "teacher" | "admin";
}

interface EditUserForm {
	id: number;
	username: string;
	role: "student" | "teacher" | "admin";
	password?: string;
}

export default function AdminDashboard() {
	const [users, setUsers] = useState<User[]>([]);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [manualUser, setManualUser] = useState({
		username: "",
		password: "",
		role: "student",
	});
	const [excelFile, setExcelFile] = useState<File | null>(null);
	const [uploadSuccess, setUploadSuccess] = useState("");
	const [uploadError, setUploadError] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRole, setSelectedRole] = useState("all");
	const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
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
	const handleRoleChange = async (
		id: number,
		newRole: "student" | "teacher" | "admin"
	) => {
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
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			// Check if file is excel
			const file = e.target.files[0];
			if (!file.name.match(/\.(xlsx|xls)$/)) {
				setUploadError("فقط فایل‌های اکسل (.xlsx, .xls) مجاز هستند");
				return;
			}
			setExcelFile(file);
			setUploadError("");
		}
	};

	const handleExcelUpload = async () => {
		if (!excelFile) {
			setUploadError("لطفاً یک فایل اکسل انتخاب کنید");
			return;
		}

		setIsUploading(true);
		setUploadError("");
		setUploadSuccess("");

		const formData = new FormData();
		formData.append("file", excelFile);

		try {
			const { data } = await api.uploadUsersExcel(formData);
			setUploadSuccess("کاربران با موفقیت اضافه شدند");
			setExcelFile(null);
			// Reset file input
			const fileInput = document.getElementById(
				"excel-upload"
			) as HTMLInputElement;
			if (fileInput) fileInput.value = "";
			// Refresh users list
			fetchUsers();
		} catch (err: any) {
			setUploadError(err.response?.data?.message || "خطا در آپلود فایل");
		} finally {
			setIsUploading(false);
		}
	};

	const getRoleLabel = (value: string) => {
		return roleOptions.find((role) => role.value === value)?.label || value;
	};

	// Filter users based on search and role
	const filteredUsers = users.filter((user) => {
		const matchesSearch = user.username
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesRole = selectedRole === "all" || user.role === selectedRole;
		return matchesSearch && matchesRole;
	});

	const handleEditClick = (user: User) => {
		// Create a new object for editing to avoid state interference
		setEditingUser({
			id: user.id,
			username: user.username,
			role: user.role,
			password: "", // Initialize empty password
		});
		// Ensure search query is not affected
		setSearchQuery("");
		onOpen();
	};

	// Add error handling for input changes
	const handleEditInputChange = (field: keyof EditUserForm, value: string) => {
		if (editingUser) {
			setEditingUser({
				...editingUser,
				[field]: value,
			});
		}
	};

	const handleEditUser = async () => {
		if (!editingUser) return;

		try {
			const updateData = {
				username: editingUser.username,
				role: editingUser.role,
				...(editingUser.password ? { password: editingUser.password } : {}),
			};

			await api.updateUser(editingUser.id, updateData);

			// Update only the edited user in the table
			setUsers((prevUsers) =>
				prevUsers.map((user) =>
					user.id === editingUser.id
						? { ...user, ...updateData } // Update only the changed fields
						: user
				)
			);

			setSuccess("کاربر با موفقیت ویرایش شد");
			onClose();
			setEditingUser(null);
		} catch (err) {
			setError("خطا در ویرایش کاربر");
		}
	};

	return (
		<div
			className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800"
			dir="rtl">
			<div className="max-w-[1400px] mx-auto p-6 space-y-8">
				{/* Header */}
				<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
					<div className="space-y-2">
						<h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold">
							پنل مدیریت کاربران
						</h1>
						<p className="text-neutral-600 dark:text-neutral-400">
							{users.length} کاربر در سیستم
						</p>
					</div>
				</div>

				{/* Tabs Container */}
				<Tabs
					aria-label="مدیریت کاربران"
					className="w-full"
					classNames={{
						base: "w-full",
						tabList: [
							"w-full",
							"gap-2",
							"p-2",
							"bg-white/50",
							"dark:bg-neutral-800/50",
							"backdrop-blur-xl",
							"rounded-2xl",
							"flex",
							"flex-wrap",
							"sm:flex-nowrap",
							"mb-6",
							"shadow-lg",
							"justify-center",
						].join(" "),
						cursor: "bg-primary text-white shadow-md",
						tab: [
							"h-12",
							"px-8",
							"flex-1",
							"max-w-[240px]",
							"text-sm",
							"lg:text-base",
							"data-[selected=true]:text-white",
							"transition-all",
							"duration-200",
							"flex",
							"items-center",
							"justify-center",
							"gap-2",
						].join(" "),
						tabContent: "font-medium",
						panel: "pt-6 animate-fade-in",
					}}>
					{/* Users List Tab */}
					<Tab
						key="users"
						title={
							<div className="flex items-center gap-2 w-full justify-center">
								<Users className="w-5 h-5" />
								<span>لیست کاربران</span>
							</div>
						}>
						<Card className="border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
							<CardBody className="p-0">
								{/* Search and Filter Section */}
								<div className="p-6 border-b border-neutral-200/50 dark:border-neutral-800/50">
									<div className="flex flex-col sm:flex-row gap-4">
										<Input
											autoComplete="off"
											placeholder="جستجوی کاربر..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											startContent={
												<Search className="w-4 h-4 text-neutral-500" />
											}
											className="w-full sm:w-72"
											classNames={{
												input: "text-right",
											}}
											name="searchQuery" // Add a random name attribute
										/>
										<Select
											selectedKeys={[selectedRole]}
											onChange={(e) => setSelectedRole(e.target.value)}
											className="w-full sm:w-48"
											defaultSelectedKeys={["all"]}>
											<SelectItem key="all" value="all">
												همه کاربران
											</SelectItem>
											<>
												{roleOptions.map((role) => (
													<SelectItem key={role.value} value={role.value}>
														{role.label}
													</SelectItem>
												))}
											</>
										</Select>
									</div>
								</div>

								{/* Users Table */}
								<div className="overflow-x-auto">
									<Table
										aria-label="لیست کاربران"
										classNames={{
											base: "w-full min-w-full",
											table: "min-w-full",
											thead: [
												"bg-neutral-50/50",
												"dark:bg-neutral-800/50",
												"sticky",
												"top-0",
												"z-20",
											].join(" "),
											th: [
												"text-right",
												"bg-transparent",
												"text-neutral-600",
												"dark:text-neutral-400",
												"text-xs",
												"tracking-wide",
												"font-medium",
												"uppercase",
												"py-4",
												"px-6",
												"border-b",
												"border-neutral-200/50",
												"dark:border-neutral-800/50",
											].join(" "),
											td: [
												"text-right",
												"py-4",
												"px-6",
												"text-sm",
												"text-neutral-600",
												"dark:text-neutral-400",
												"border-b",
												"border-neutral-200/50",
												"dark:border-neutral-800/50",
											].join(" "),
											tr: [
												"transition-colors",
												"hover:bg-neutral-50/50",
												"dark:hover:bg-neutral-800/50",
											].join(" "),
										}}
										removeWrapper>
										<TableHeader>
											<TableColumn className="text-right">شناسه</TableColumn>
											<TableColumn className="text-right">
												نام کاربری
											</TableColumn>
											<TableColumn className="text-right">
												نقش کاربر
											</TableColumn>
											<TableColumn className="text-right">عملیات</TableColumn>
										</TableHeader>
										<TableBody emptyContent="کاربری یافت نشد">
											{filteredUsers.map((user) => {
												const RoleIcon =
													roleConfig[user.role as keyof typeof roleConfig].icon;
												return (
													<TableRow key={user.id}>
														<TableCell>
															<span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg font-mono">
																#{user.id.toString().padStart(4, "0")}
															</span>
														</TableCell>
														<TableCell>
															<div className="flex items-center gap-3">
																<div
																	className={`w-8 h-8 rounded-full ${
																		roleConfig[user.role].bgColor
																	} flex items-center justify-center`}>
																	<RoleIcon
																		className={roleConfig[user.role].textColor}
																		size={16}
																	/>
																</div>
																<div className="flex flex-col">
																	<span className="font-medium text-neutral-900 dark:text-neutral-100">
																		{user.username}
																	</span>
																	<span className="text-xs text-neutral-500">
																		{roleConfig[user.role].label}
																	</span>
																</div>
															</div>
														</TableCell>
														<TableCell>
															<Chip
																variant="flat"
																color={roleConfig[user.role].color as any}
																startContent={
																	<RoleIcon className="w-3.5 h-3.5" />
																}
																className="h-7">
																{roleConfig[user.role].label}
															</Chip>
														</TableCell>
														<TableCell>
															<div className="flex gap-2">
																<Button
																	color="primary"
																	variant="flat"
																	size="sm"
																	startContent={<Pencil size={16} />}
																	onClick={() => handleEditClick(user)}>
																	ویرایش
																</Button>
																<Button
																	color="danger"
																	variant="flat"
																	size="sm"
																	startContent={<Trash2 size={16} />}
																	onClick={() => handleDeleteUser(user.id)}>
																	حذف
																</Button>
															</div>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</CardBody>
						</Card>
					</Tab>

					{/* Add User Tab */}
					<Tab
						key="add-user"
						title={
							<div className="flex items-center gap-2 w-full justify-center">
								<UserPlus className="w-5 h-5" />
								<span>افزودن کاربر</span>
							</div>
						}>
						<div className="max-w-3xl mx-auto">
							<Card className="border border-neutral-200/50 dark:border-neutral-800/50 shadow-lg">
								<CardBody className="p-8">
									{/* Header */}
									<div className="flex flex-col items-center mb-10 animate-fade-in">
										<div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
											<UserPlus className="w-8 h-8 text-primary" />
										</div>
										<h2 className="text-2xl font-bold">ایجاد کاربر جدید</h2>
										<p className="text-neutral-600 dark:text-neutral-400 mt-2">
											اطلاعات کاربر جدید را وارد کنید
										</p>
									</div>

									{/* Form */}
									<form onSubmit={handleCreateUserManual} className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											{/* Username Field */}
											<div className="space-y-2">
												<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
													نام کاربری
												</label>
												<Input
													placeholder="نام کاربری را وارد کنید"
													value={manualUser.username}
													onChange={(e) =>
														setManualUser({
															...manualUser,
															username: e.target.value,
														})
													}
													classNames={{
														base: "max-w-full",
														inputWrapper: [
															"h-12",
															"bg-transparent",
															"border-2",
															"border-neutral-200",
															"dark:border-neutral-800",
															"hover:border-primary",
															"dark:hover:border-primary",
															"transition-colors",
														].join(" "),
														input: "text-right h-12",
													}}
													variant="bordered"
													required
												/>
											</div>

											{/* Password Field */}
											<div className="space-y-2">
												<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
													رمز عبور
												</label>
												<Input
													type="password"
													placeholder="رمز عبور را وارد کنید"
													value={manualUser.password}
													onChange={(e) =>
														setManualUser({
															...manualUser,
															password: e.target.value,
														})
													}
													classNames={{
														base: "max-w-full",
														inputWrapper: [
															"h-12",
															"bg-transparent",
															"border-2",
															"border-neutral-200",
															"dark:border-neutral-800",
															"hover:border-primary",
															"dark:hover:border-primary",
															"transition-colors",
														].join(" "),
														input: "text-right h-12",
													}}
													variant="bordered"
													required
												/>
											</div>
										</div>

										{/* Role Selection */}
										<div className="space-y-2">
											<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
												نقش کاربر
											</label>
											<Select
												placeholder="نقش کاربر را انتخاب کنید"
												selectedKeys={[manualUser.role]}
												onChange={(e) =>
													setManualUser({ ...manualUser, role: e.target.value })
												}
												classNames={{
													base: "max-w-full",
													trigger: [
														"h-12",
														"bg-transparent",
														"border-2",
														"border-neutral-200",
														"dark:border-neutral-800",
														"hover:border-primary",
														"dark:hover:border-primary",
														"transition-colors",
													].join(" "),
													value: "text-right",
													listbox: "text-right",
												}}
												variant="bordered">
												{roleOptions.map((role) => (
													<SelectItem key={role.value} value={role.value}>
														{role.label}
													</SelectItem>
												))}
											</Select>
										</div>

										<Button
											type="submit"
											color="primary"
											className="w-full h-12 font-medium shadow-lg hover:shadow-primary/25 transition-all duration-200"
											size="lg">
											ایجاد کاربر
										</Button>
									</form>
								</CardBody>
							</Card>
						</div>
					</Tab>

					{/* Excel Import Tab */}
					<Tab
						key="excel-import"
						title={
							<div className="flex items-center gap-2 w-full justify-center">
								<FileSpreadsheet className="w-5 h-5" />
								<span>افزودن گروهی</span>
							</div>
						}>
						<div className="max-w-3xl mx-auto">
							<Card className="border border-neutral-200/50 dark:border-neutral-800/50 shadow-lg">
								<CardBody className="space-y-6">
									<div className="flex items-center justify-between">
										<h3 className="text-lg font-semibold">
											افزودن کاربران با اکسل
										</h3>
										<Button
											as="a"
											href="/template/users-template.xlsx"
											download
											color="primary"
											variant="ghost"
											startContent={<FileSpreadsheet className="w-4 h-4" />}>
											دانلود قالب اکسل
										</Button>
									</div>

									<div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl پ-6">
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 text-center text-sm">
											<div className="space-y-2 پ-4 rounded-lg bg-white dark:bg-neutral-800">
												<p className="font-medium text-primary">ستون A</p>
												<p className="font-bold">نام کاربری</p>
												<p className="text-neutral-500">مثال: student1</p>
											</div>
											<div className="space-y-2 پ-4 rounded-lg bg-white dark:bg-neutral-800">
												<p className="font-medium text-primary">ستون B</p>
												<p className="font-bold">رمز عبور</p>
												<p className="text-neutral-500">مثال: Pass123!</p>
											</div>
											<div className="space-y-2 پ-4 rounded-lg bg-white dark:bg-neutral-800">
												<p className="font-medium text-primary">ستون C</p>
												<p className="font-bold">نقش کاربر</p>
												<p className="text-neutral-500">
													student/teacher/admin
												</p>
											</div>
										</div>

										<div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg پ-4 text-right">
											<p className="font-medium text-warning-600 mb-2">
												نکات مهم:
											</p>
											<ul className="list-disc list-inside space-y-1 text-sm text-warning-600">
												<li>ردیف اول شامل عنوان ستون‌ها باشد</li>
												<li>نام کاربری حداقل ۳ کاراکتر باشد</li>
												<li>رمز عبور حداقل ۶ کاراکتر باشد</li>
												<li>نقش کاربر یکی از موارد بالا باشد</li>
											</ul>
										</div>
									</div>

									<div className="space-y-4">
										<Input
											id="excel-upload"
											type="file"
											accept=".xlsx,.xls"
											onChange={handleFileChange}
											className="w-full"
											classNames={{
												label: "text-right",
												input: "text-right",
											}}
											description="فقط فایل‌های اکسل (.xlsx, .xls) قابل قبول هستند"
										/>
										{uploadError && (
											<div className="flex items-center gap-2 text-danger text-sm">
												<AlertCircle className="w-4 h-4" />
												{uploadError}
											</div>
										)}
										{uploadSuccess && (
											<div className="flex items-center gap-2 text-success text-sm">
												<AlertCircle className="w-4 h-4" />
												{uploadSuccess}
											</div>
										)}
										<Button
											color="primary"
											className="w-full"
											startContent={<Upload className="w-4 h-4" />}
											isLoading={isUploading}
											onClick={handleExcelUpload}
											isDisabled={!excelFile}>
											آپلود و افزودن کاربران
										</Button>
									</div>
								</CardBody>
							</Card>
						</div>
					</Tab>
				</Tabs>

				{/* Notifications */}
				{error && (
					<div className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 پ-4 rounded-xl shadow-xl backdrop-blur-xl flex items-center gap-3 animate-slide-in-right">
						<AlertCircle className="w-5 h-5 flex-shrink-0" />
						<p className="text-sm font-medium">{error}</p>
					</div>
				)}

				{success && (
					<div className="fixed bottom-6 right-6 bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 پ-4 rounded-xl shadow-xl backdrop-blur-xl flex items-center gap-3 animate-slide-in-right">
						<AlertCircle className="w-5 h-5 flex-shrink-0" />
						<p className="text-sm font-medium">{success}</p>
					</div>
				)}
			</div>

			{/* Edit User Modal */}
			<Modal
				isOpen={isOpen}
				onClose={() => {
					setEditingUser(null);
					onClose();
				}}
				size="md">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<h3 className="text-lg font-bold">ویرایش کاربر</h3>
								<p className="text-sm text-neutral-500">
									{editingUser?.username || ""}
								</p>
							</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<Input
										label="نام کاربری"
										value={editingUser?.username || ""}
										onChange={(e) =>
											handleEditInputChange("username", e.target.value)
										}
										variant="bordered"
										classNames={{
											label: "text-right",
											input: "text-right",
										}}
									/>
									<Input
										label="رمز عبور جدید"
										type="password"
										placeholder="خالی بگذارید اگر نمی‌خواهید تغییر کند"
										value={editingUser?.password || ""}
										onChange={(e) =>
											handleEditInputChange("password", e.target.value)
										}
										variant="bordered"
										classNames={{
											label: "text-right",
											input: "text-right",
										}}
									/>
									<Select
										label="نقش کاربر"
										selectedKeys={editingUser?.role ? [editingUser.role] : []}
										onChange={(e) =>
											handleEditInputChange("role", e.target.value)
										}
										variant="bordered"
										classNames={{
											label: "text-right",
											value: "text-right",
										}}>
										{roleOptions.map((role) => (
											<SelectItem
												key={role.value}
												value={role.value}
												startContent={
													<div
														className={`پ-1 rounded-md ${
															roleConfig[role.value as User["role"]].bgColor
														}`}>
														{React.createElement(
															roleConfig[role.value as User["role"]].icon,
															{
																className:
																	roleConfig[role.value as User["role"]]
																		.textColor,
																size: 16,
															}
														)}
													</div>
												}>
												{role.label}
											</SelectItem>
										))}
									</Select>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button
									color="danger"
									variant="light"
									onPress={() => {
										onClose();
										setEditingUser(null);
									}}>
									انصراف
								</Button>
								<Button
									color="primary"
									onPress={handleEditUser}
									isDisabled={!editingUser?.username}>
									ذخیره تغییرات
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
