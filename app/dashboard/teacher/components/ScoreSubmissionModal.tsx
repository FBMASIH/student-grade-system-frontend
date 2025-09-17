// Create a new component for better organization

import { Modal, ModalContent, ModalHeader, Chip, ModalBody, Select, SelectItem, Card, CardBody, TableHeader, TableColumn, TableBody, TableRow, TableCell, ModalFooter, Button } from "@nextui-org/react";
import { Search, Users, Check, AlertCircle, Table, FileCheck } from "lucide-react";
import { Input } from "@nextui-org/react";
import { useState, useEffect, SetStateAction } from "react";

interface Student {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	score?: number;
}

interface ScoreModalProps {
	isOpen: boolean;
	onClose: () => void;
	groupInfo: {
		courseName: string;
		groupNumber: number;
		students: Student[];
	} | null;
	onSubmitScores: (scores: Record<number, number>) => Promise<void>;
}

export function ScoreSubmissionModal({
	isOpen,
	onClose,
	groupInfo,
	onSubmitScores,
}: ScoreModalProps) {
	const [scores, setScores] = useState<Record<number, number>>({});

	const handleScoreChange = (studentId: number, value: string) => {
		const score = parseFloat(value);
		if (!isNaN(score) && score >= 0 && score <= 20) {
			setScores((prevScores) => ({
				...prevScores,
				[studentId]: score,
			}));
		} else {
			setScores((prevScores) => {
				const newScores = { ...prevScores };
				delete newScores[studentId];
				return newScores;
			});
		}
	};
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			await onSubmitScores(scores);
			onClose();
		} catch (error) {
			console.error("Failed to submit scores", error);
		} finally {
			setIsSubmitting(false);
		}
	};
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
	const [selectedFilter, setSelectedFilter] = useState<
		"all" | "scored" | "unscored"
	>("all");

	useEffect(() => {
		if (groupInfo?.students) {
			const filtered = groupInfo.students.filter((student) => {
				const matchesSearch =
					student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
					student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
					student.lastName.toLowerCase().includes(searchQuery.toLowerCase());

				const matchesFilter =
					selectedFilter === "all" ||
					(selectedFilter === "scored" && student.score !== undefined) ||
					(selectedFilter === "unscored" && student.score === undefined);

				return matchesSearch && matchesFilter;
			});
			setFilteredStudents(filtered);
		}
	}, [searchQuery, groupInfo, selectedFilter]);

	return (
		<Modal size="4xl" isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader>
							<div className="flex flex-col gap-1">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-bold">ثبت نمرات</h3>
									<Chip size="sm" color="primary">
										{groupInfo?.students.length} دانشجو
									</Chip>
								</div>
								<p className="text-sm text-neutral-500">
									{groupInfo?.courseName} - گروه {groupInfo?.groupNumber}
								</p>
							</div>
						</ModalHeader>
						<ModalBody>
							<div className="space-y-4">
								{/* Search & Filters */}
								<div className="flex gap-4">
                                                                        <Input
                                                                                placeholder="جستجوی دانشجو..."
                                                                                value={searchQuery}
                                                                                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setSearchQuery(e.target.value)}
                                                                                startContent={
                                                                                        <Search className="w-4 h-4 text-neutral-500" />
                                                                                }
                                                                                className="flex-1"
                                                                                aria-label="جستجوی دانشجو در لیست نمرات"
                                                                        />
                                                                        <Select
                                                                                selectedKeys={[selectedFilter]}
                                                                                onChange={(e) => setSelectedFilter(e.target.value as any)}
                                                                                className="w-48"
                                                                                aria-label="فیلتر وضعیت نمره">
										<SelectItem key="all" value="all">
											همه دانشجویان
										</SelectItem>
										<SelectItem key="scored" value="scored">
											نمره داده شده
										</SelectItem>
										<SelectItem key="unscored" value="unscored">
											بدون نمره
										</SelectItem>
									</Select>
								</div>

								{/* Quick Stats */}
								<div className="grid grid-cols-3 gap-4">
									<Card>
										<CardBody className="p-4">
											<div className="flex items-center gap-3">
												<div className="p-2 rounded-lg bg-primary/10">
													<Users className="w-5 h-5 text-primary" />
												</div>
												<div>
													<p className="text-sm text-neutral-600">
														کل دانشجویان
													</p>
													<p className="text-xl font-bold">
														{groupInfo?.students.length || 0}
													</p>
												</div>
											</div>
										</CardBody>
									</Card>
									<Card>
										<CardBody className="p-4">
											<div className="flex items-center gap-3">
												<div className="p-2 rounded-lg bg-success/10">
													<Check className="w-5 h-5 text-success" />
												</div>
												<div>
													<p className="text-sm text-neutral-600">
														نمره داده شده
													</p>
													<p className="text-xl font-bold">
														{groupInfo?.students.filter(
															(s) => s.score !== undefined
														).length || 0}
													</p>
												</div>
											</div>
										</CardBody>
									</Card>
									<Card>
										<CardBody className="p-4">
											<div className="flex items-center gap-3">
												<div className="p-2 rounded-lg bg-warning/10">
													<AlertCircle className="w-5 h-5 text-warning" />
												</div>
												<div>
													<p className="text-sm text-neutral-600">بدون نمره</p>
													<p className="text-xl font-bold">
														{groupInfo?.students.filter(
															(s) => s.score === undefined
														).length || 0}
													</p>
												</div>
											</div>
										</CardBody>
									</Card>
								</div>

								{/* Students Table */}
								<Table
									aria-label="لیست دانشجویان"
									className="border border-neutral-200/50 dark:border-neutral-800/50 rounded-lg">
									<TableHeader>
										<TableColumn>شماره دانشجویی</TableColumn>
										<TableColumn>نام و نام خانوادگی</TableColumn>
										<TableColumn>نمره فعلی</TableColumn>
										<TableColumn>نمره جدید</TableColumn>
									</TableHeader>
									<TableBody emptyContent="دانشجویی یافت نشد">
										{filteredStudents.map((student) => (
											<TableRow key={student.id}>
												<TableCell>{student.username}</TableCell>
												<TableCell>
													<div className="flex flex-col">
														<span>
															{student.firstName} {student.lastName}
														</span>
													</div>
												</TableCell>
												<TableCell>
													{student.score ?? (
														<Chip size="sm" color="warning" variant="flat">
															ثبت نشده
														</Chip>
													)}
												</TableCell>
												<TableCell>
                                                                                                       <Input
                                                                                                               type="number"
                                                                                                               min="0"
                                                                                                               max="20"
                                                                                                               step="0.25"
                                                                                                               placeholder="0-20"
                                                                                                               value={scores[student.id]?.toString() ?? ""}
                                                                                                               onChange={(e: { target: { value: any; }; }) =>
                                                                                                                       handleScoreChange(student.id, e.target.value)
                                                                                                               }
                                                                                                               className="w-24"
                                                                                                               endContent={
                                                                                                                       scores[student.id] !== undefined && (
                                                                                                                               <Check className="w-4 h-4 text-success" />
                                                                                                                       )
                                                                                                               }
                                                                                                               aria-label={`نمره جدید برای ${student.firstName} ${student.lastName}`}
                                                                                                       />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</ModalBody>
						<ModalFooter>
							<div className="flex justify-between w-full">
								<div className="flex items-center gap-2">
									<span className="text-sm text-neutral-600">
										{Object.keys(scores).length} نمره جدید برای ثبت
									</span>
								</div>
								<div className="flex gap-2">
									<Button color="danger" variant="light" onPress={onClose}>
										انصراف
									</Button>
									<Button
										color="primary"
										onPress={handleSubmit}
										isLoading={isSubmitting}
										startContent={<FileCheck className="w-4 h-4" />}
										isDisabled={Object.keys(scores).length === 0}>
										ثبت نمرات
									</Button>
								</div>
							</div>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
