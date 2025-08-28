"use client";

import { courseGroupsApi } from "@/lib/api";
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
import { AlertCircle, Book, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface Group {
	id: number;
	groupNumber: number;
	currentEnrollment: number;
	capacity: number;
	course: {
		id: number;
		name: string;
	};
	professor: {
		id: number;
		username: string;
		role: string;
	};
}

interface Course {
        id: number;
        name: string;
        code: string;
        professor: { name: string };
}

export default function GroupsManagement() {
	const [groups, setGroups] = useState<Group[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [formData, setFormData] = useState({
		courseId: "",
		professorId: "",
	});
	const [error, setError] = useState("");
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetchGroups(page);
	}, [page]);

	const fetchGroups = async (currentPage: number) => {
		try {
			setIsLoading(true);
			const response = await courseGroupsApi.getAllGroups(
				currentPage,
				10,
				searchQuery
			);
                        setGroups(response.data.items);
                        setTotalPages(response.data?.meta?.totalPages ?? 1);
		} catch (err: any) {
			console.error("Error fetching groups:", err);
			setError(err.message);
			setGroups([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = (value: string) => {
		setSearchQuery(value);
		setPage(1);
		fetchGroups(1);
	};

	const handleCreateGroup = async () => {
		try {
			await courseGroupsApi.createGroup({
				courseId: parseInt(formData.courseId),
				professorId: parseInt(formData.professorId),
			});
			onClose();
			fetchGroups(page);
			setFormData({ courseId: "", professorId: "" });
		} catch (err: any) {
			setError(err.message);
		}
	};

	const handleDeleteGroup = async (id: number) => {
		if (!confirm("آیا از حذف این گروه اطمینان دارید؟")) return;

		try {
			await courseGroupsApi.deleteGroup(id);
			fetchGroups(page);
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
						{groups.length} گروه فعال در سیستم
					</p>
				</div>
				<Button
					color="primary"
					startContent={<Plus className="w-4 h-4" />}
					onPress={onOpen}>
					افزودن گروه جدید
				</Button>
			</div>

			<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
				<CardBody className="p-0">
					{isLoading ? (
						<div className="p-4 text-center">Loading...</div>
					) : (
						<>
							<div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
								<Input
									placeholder="جستجو در گروه‌ها..."
									value={searchQuery}
									onChange={(e) => handleSearch(e.target.value)}
									startContent={<Search className="w-4 h-4 text-neutral-500" />}
									className="w-full sm:w-72"
								/>
							</div>

							<Table aria-label="لیست گروه‌ها">
								<TableHeader>
									<TableColumn>شماره گروه</TableColumn>
									<TableColumn>نام درس</TableColumn>
									<TableColumn>ظرفیت</TableColumn>
									<TableColumn>عملیات</TableColumn>
								</TableHeader>
								<TableBody emptyContent="گروهی یافت نشد">
									{groups.map((group) => (
										<TableRow key={group.id}>
											<TableCell>{group.groupNumber}</TableCell>
											<TableCell>{group.course.name}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Book className="w-4 h-4 text-neutral-500" />
													{group.currentEnrollment}/{group.capacity}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex gap-2">
													<Button
														color="danger"
														variant="flat"
														size="sm"
														onClick={() => handleDeleteGroup(group.id)}>
														حذف گروه
													</Button>
												</div>
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

			{/* Add Group Modal */}
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>افزودن گروه جدید</ModalHeader>
							<ModalBody className="gap-4">
								<Input
									label="درس"
									placeholder="شناسه درس"
									value={formData.courseId}
									onChange={(e) =>
										setFormData({ ...formData, courseId: e.target.value })
									}
								/>
								<Input
									label="استاد"
									placeholder="شناسه استاد"
									value={formData.professorId}
									onChange={(e) =>
										setFormData({ ...formData, professorId: e.target.value })
									}
								/>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									انصراف
								</Button>
								<Button
									color="primary"
									onPress={handleCreateGroup}
									isDisabled={!formData.courseId || !formData.professorId}>
									افزودن گروه
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
