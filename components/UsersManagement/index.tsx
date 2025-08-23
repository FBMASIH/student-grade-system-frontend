"use client";

import { api } from "@/lib/api";
import { tableStyles } from "@/lib/tableStyles";
import { Button, useDisclosure } from "@nextui-org/react";
import { AlertCircle, Upload } from "lucide-react";
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
import { EditUserModal } from "./EditUserModal"; // Import the new modal
import { UploadExcelModal } from "./UploadExcelModal"; // Import the new modal
import { UserModal } from "./UserModal";
import { UsersTable } from "./UsersTable";

import { User } from "@/lib/types/common";
import { toast } from "sonner";

interface UsersManagementProps {
	initialData: User[];
	onUserChange?: () => void;
}

interface RegisteredUser {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
}

interface DuplicateUser {
	username: string;
	firstName: string;
	lastName: string;
	message: string;
}

export function UsersManagement({
	initialData,
	onUserChange,
}: UsersManagementProps) {
	const [error, setError] = useState("");
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const mounted = useRef(false);
	const {
		isOpen: isEditModalOpen,
		onOpen: onOpenEditModal,
		onClose: onCloseEditModal,
	} = useDisclosure();
	const [updateUsername, setUpdateUsername] = useState("");
	const [updateRole, setUpdateRole] = useState("");
	const [updatePassword, setUpdatePassword] = useState("");
	const [updateFirstName, setUpdateFirstName] = useState("");
	const [updateLastName, setUpdateLastName] = useState("");
	const [localUsers, setLocalUsers] = useState<User[]>(initialData);

	const {
		isOpen: isUploadExcelOpen,
		onOpen: onUploadExcelOpen,
		onClose: onUploadExcelClose,
	} = useDisclosure();
	const [isUploading, setIsUploading] = useState(false);
	const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
	const [duplicateUsers, setDuplicateUsers] = useState<DuplicateUser[]>([]);
	const [uploadErrors, setUploadErrors] = useState<string[]>([]);

	const refreshTable = useCallback(() => {
		api.getUsers().then((res) => {
			setLocalUsers(res.data.items || []);
		});
	}, []);

	// Only run effect for selectedUser changes after mount
	useEffect(() => {
		if (!mounted.current) {
			mounted.current = true;
			return;
		}

		if (selectedUser) {
			setUpdateUsername(selectedUser.username);
			setUpdateRole(selectedUser.role);
			setUpdateFirstName(selectedUser.firstName);
			setUpdateLastName(selectedUser.lastName);
			setUpdatePassword(""); // Clear password field on open
		}
	}, [selectedUser]);

        const handleCreateUser = async (
                username: string,
                password: string,
                firstName: string,
                lastName: string,
                role: string,
                groupId: number
        ) => {
                try {
                        await api.createUserManual(
                                username,
                                password,
                                firstName,
                                lastName,
                                role,
                                groupId
                        );
                        onUserChange?.(); // Call the callback directly
                        onClose();
                        toast.success("کاربر با موفقیت ایجاد شد");
                } catch (err: any) {
                        setError(getPersianErrorMessage(err.message));
                }
        };

	const handleEditUser = (user: User) => {
		setSelectedUser(user);
		setUpdateUsername(user.username);
		setUpdateRole(user.role);
		setUpdateFirstName(user.firstName);
		setUpdateLastName(user.lastName);
		onOpenEditModal();
	};

	const handleDeleteUser = async (id: number) => {
		try {
			await api.deleteUser(id);
			refreshTable();
			toast.success("کاربر با موفقیت حذف شد");
			onUserChange?.(); // Call the callback directly
		} catch (err: any) {
			setError(getPersianErrorMessage(err.message));
		}
	};

	const handleDeleteMultipleUsers = async (userIds: number[]) => {
		try {
			await api.deleteMultipleUsers(userIds);
			refreshTable();
			toast.success("کاربران با موفقیت حذف شدند");
			onUserChange?.(); // Call the callback directly
		} catch (err: any) {
			setError(getPersianErrorMessage(err.message));
		}
	};

	const handleDeleteAllStudents = async () => {
		if (window.confirm("آیا از حذف تمامی دانشجویان اطمینان دارید؟")) {
			try {
				await api.deleteAllStudents();
				refreshTable();
				toast.success("تمامی دانشجویان با موفقیت حذف شدند");
				onUserChange?.(); // Call the callback directly
			} catch (err: any) {
				setError(getPersianErrorMessage(err.message));
			}
		}
	};

	const handleUpdateUser = async (
		username: string,
		role: string,
		password?: string,
		firstName?: string,
		lastName?: string
	) => {
		if (!selectedUser) return;

		try {
			const updateData = {
				...(username !== selectedUser.username && { username }),
				...(role !== selectedUser.role && { role }),
				...(password && { password }),
				...(firstName !== selectedUser.firstName && { firstName }),
				...(lastName !== selectedUser.lastName && { lastName }),
			};

			if (Object.keys(updateData).length === 0) {
				onCloseEditModal();
				return;
			}

			await api.updateUser(selectedUser.id, updateData);
			refreshTable();
			onCloseEditModal();
			toast.success("کاربر با موفقیت بروزرسانی شد");
			onUserChange?.(); // Call the callback directly
		} catch (err: any) {
			setError(getPersianErrorMessage(err.message));
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		setDuplicateUsers([]);
		setUploadErrors([]);

		const formData = new FormData();
		formData.append("file", file);

		try {
			const { data } = await api.uploadUsersExcel(formData);
			console.log("Upload response:", data);

			const validUsers = [...(data.users || []), ...(data.reactivated || [])];
			setRegisteredUsers(validUsers);

			setDuplicateUsers(data.duplicates || []);
			setUploadErrors(data.errors || []);

			if (data.users?.length > 0) {
				toast.success(`${data.users.length} کاربر جدید با موفقیت ثبت شد`);
			}
			if (data.reactivated?.length > 0) {
				toast.success(`${data.reactivated.length} کاربر مجدداً فعال شد`);
			}

			data.duplicates?.forEach(
				(d: { firstName: any; lastName: any; username: any; message: any }) => {
					toast.warning(
						`${d.firstName} ${d.lastName} (${d.username}): ${d.message}`
					);
				}
			);

			data.errors?.forEach(
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
		} catch (err: any) {
			console.error("Upload error:", err);
			toast.error(err.response?.data?.message || "خطا در آپلود فایل");
			setRegisteredUsers([]);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="space-y-4">
			<UsersTable
				initialData={localUsers} // Use localUsers instead of initialData
				onAddUser={onOpen}
				onEditUser={handleEditUser}
				onDeleteUser={handleDeleteUser}
				onDeleteMultipleUsers={handleDeleteMultipleUsers} // Add new prop
				styles={tableStyles}
			/>
			<UserModal
				isOpen={isOpen}
				onClose={onClose}
				onSubmit={handleCreateUser}
			/>
			<EditUserModal // Add the new modal
				isOpen={isEditModalOpen}
				onClose={onCloseEditModal}
				onSubmit={handleUpdateUser}
				username={updateUsername}
				role={updateRole}
				setUpdateUsername={setUpdateUsername}
				setUpdateRole={setUpdateRole}
				setUpdatePassword={setUpdatePassword}
				setUpdateFirstName={setUpdateFirstName}
				setUpdateLastName={setUpdateLastName}
				firstName={updateFirstName}
				lastName={updateLastName}
			/>
			<div className="flex space-x-2">
				<Button
					color="primary"
					variant="light"
					onPress={onOpen}
					className="font-medium">
					افزودن کاربر
				</Button>
				<Button
					color="primary"
					variant="light"
					onPress={onUploadExcelOpen}
					className="font-medium">
					<Upload className="w-5 h-5" />
					آپلود اکسل
				</Button>
			</div>
			<Button
				color="danger"
				variant="light"
				onPress={handleDeleteAllStudents}
				className="font-medium">
				حذف تمامی دانشجویان
			</Button>
			{error && (
				<div className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-4 rounded-xl shadow-lg flex items-center gap-3">
					<AlertCircle className="w-5 h-5" />
					<p>{error}</p>
				</div>
			)}
			<UploadExcelModal
				isOpen={isUploadExcelOpen}
				onClose={onUploadExcelClose}
			/>
		</div>
	);
}

function getPersianErrorMessage(message: string): string {
	switch (message) {
		case "Request failed with status code 400":
			return "اطلاعات وارد شده صحیح نیست.";
		case "Request failed with status code 401":
			return "نام کاربری یا رمز عبور اشتباه است.";
		case "Request failed with status code 404":
			return "کاربر مورد نظر یافت نشد.";
		case "Request failed with status code 500":
			return "خطا در سرور. لطفا دوباره تلاش کنید.";
		default:
			return "یک خطا رخ داده است.";
	}
}
