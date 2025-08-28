"use client";

import { api } from "@/lib/api";
import { PaginatedResponse } from "@/lib/types/common";
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
import { AlertCircle, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface User {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
}

export default function UserManagement() {
	const [users, setUsers] = useState<User[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [error, setError] = useState("");
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [isLoading, setIsLoading] = useState(true);
	const searchTimeout = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		fetchUsers(page, searchQuery);
	}, [page, searchQuery]);

	const fetchUsers = async (currentPage: number, query: string) => {
		try {
			setIsLoading(true);
			const response = await api.getUsers(currentPage, 10, query);
			const paginatedData = response.data as PaginatedResponse;

                        setUsers(paginatedData.items);
                        setTotalPages(paginatedData?.meta?.totalPages ?? 1);
		} catch (err: any) {
			console.error("Error fetching users:", err);
			setError(err.message);
			setUsers([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = (value: string) => {
		setSearchQuery(value);
		setPage(1);
		if (searchTimeout.current) {
			clearTimeout(searchTimeout.current);
		}
		searchTimeout.current = setTimeout(() => {
			fetchUsers(1, value);
		}, 500);
	};

	const handleOpenModal = (user: User) => {
		setSelectedUser(user);
		onOpen();
	};

	const handleSubmitUser = async () => {
		if (selectedUser) {
			try {
				await api.updateUser(selectedUser.id, selectedUser);
				onClose();
				fetchUsers(page, searchQuery);
			} catch (err: any) {
				setError(err.message);
			}
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold">مدیریت کاربران</h2>
					<p className="text-neutral-600 dark:text-neutral-400">
						{users.length} کاربر فعال در سیستم
					</p>
				</div>
			</div>

			<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
				<CardBody className="p-0">
					{isLoading ? (
						<div className="p-4 text-center">Loading...</div>
					) : (
						<>
							<div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
								<Input
									placeholder="جستجو در کاربران..."
									value={searchQuery}
									onChange={(e) => handleSearch(e.target.value)}
									startContent={<Search className="w-4 h-4 text-neutral-500" />}
									className="w-full sm:w-72"
								/>
							</div>

                                                        <Table aria-label="لیست کاربران">
                                                                <TableHeader>
                                                                        <TableColumn>نام و نام خانوادگی</TableColumn>
                                                                        <TableColumn>نام کاربری</TableColumn>
                                                                        <TableColumn>نقش</TableColumn>
                                                                        <TableColumn>عملیات</TableColumn>
                                                                </TableHeader>
                                                                <TableBody emptyContent="کاربری یافت نشد">
                                                                        {users.map((user) => (
                                                                                <TableRow key={user.id}>
                                                                                        <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                                                                                        <TableCell>{user.username}</TableCell>
                                                                                        <TableCell>{user.role}</TableCell>
                                                                                        <TableCell>
                                                                                                <Button
                                                                                                        color="primary"
                                                                                                        variant="flat"
                                                                                                        size="sm"
                                                                                                        onClick={() => handleOpenModal(user)}>
                                                                                                        ویرایش
                                                                                                </Button>
                                                                                        </TableCell>
                                                                                </TableRow>
                                                                        ))}
                                                                </TableBody>
                                                        </Table>
                                                </>
                                        )}
                                </CardBody>
                        </Card>

			<div className="flex justify-center">
				<Pagination
					total={totalPages}
					initialPage={1}
					page={page}
					onChange={(page) => setPage(page)}
				/>
			</div>

			{error && (
				<div className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-4 rounded-xl shadow-lg flex items-center gap-3">
					<AlertCircle className="w-5 h-5" />
					<p>{error}</p>
				</div>
			)}

			{/* Edit User Modal */}
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>ویرایش کاربر</ModalHeader>
							<ModalBody className="gap-4">
								<Input
									label="نام"
									value={selectedUser?.firstName || ""}
									onChange={(e) =>
										setSelectedUser((prev) =>
											prev ? { ...prev, firstName: e.target.value } : null
										)
									}
								/>
								<Input
									label="نام خانوادگی"
									value={selectedUser?.lastName || ""}
									onChange={(e) =>
										setSelectedUser((prev) =>
											prev ? { ...prev, lastName: e.target.value } : null
										)
									}
								/>
								<Input
									label="ایمیل"
									type="email"
									value={selectedUser?.email || ""}
									onChange={(e) =>
										setSelectedUser((prev) =>
											prev ? { ...prev, email: e.target.value } : null
										)
									}
								/>
								<Input
									label="نقش"
									value={selectedUser?.role || ""}
									onChange={(e) =>
										setSelectedUser((prev) =>
											prev ? { ...prev, role: e.target.value } : null
										)
									}
								/>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									انصراف
								</Button>
								<Button
									color="primary"
									onPress={handleSubmitUser}
									isDisabled={!selectedUser}>
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
