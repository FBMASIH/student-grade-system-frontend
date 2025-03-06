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
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@nextui-org/react";
import { AlertCircle, Check, FileCheck, Search, Users } from "lucide-react";
import { SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";

interface Student {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	groupNumber: number;
	score: number | null;
}

interface ScoreModalProps {
	isOpen: boolean;
	onClose: () => void;
	courseId: number;
	courseName: string;
	onSubmitScores: (scores: Record<number, number>) => Promise<void>;
	groupId: number; // Add this new prop
}

export function ScoreSubmissionModal({
	isOpen,
	onClose,
	courseId,
	courseName,
	groupId, // Add this new prop
	onSubmitScores,
}: ScoreModalProps) {
	const [students, setStudents] = useState<Student[]>([]);
	const [scores, setScores] = useState<Record<number, number>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
	const [selectedFilter, setSelectedFilter] = useState<
		"all" | "scored" | "unscored"
	>("all");

	useEffect(() => {
		const fetchStudents = async () => {
			if (courseId === 0) return;

			try {
				const { data } = await api.getCourseStudents(courseId);
				setStudents(data);
				setFilteredStudents(data);
			} catch (error) {
				console.error("Failed to fetch students", error);
			}
		};

		if (isOpen && courseId > 0) {
			fetchStudents();
		}
	}, [isOpen, courseId]);

	useEffect(() => {
		const filtered = students.filter((student) => {
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
	}, [searchQuery, students, selectedFilter]);

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

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			// Transform scores object to array format
			const scoresArray = Object.entries(scores).map(([studentId, score]) => ({
				studentId: Number(studentId),
				score: Number(score),
			}));

			// Submit scores using the new endpoint
			await api.submitGroupScores(groupId, scoresArray);
			onClose();
			toast.success("نمرات با موفقیت ثبت شدند");
		} catch (error) {
			console.error("Failed to submit scores", error);
			toast.error("خطا در ثبت نمرات");
		} finally {
			setIsSubmitting(false);
		}
	};

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
										{students.length} دانشجو
									</Chip>
								</div>
								<p className="text-sm text-neutral-500">{courseName}</p>
							</div>
						</ModalHeader>
						<ModalBody>
							<div className="space-y-4">
								{/* Search & Filters */}
								<div className="flex gap-4">
									<Input
										placeholder="جستجوی دانشجو..."
										value={searchQuery}
										onChange={(e: {
											target: { value: SetStateAction<string> };
										}) => setSearchQuery(e.target.value)}
										startContent={
											<Search className="w-4 h-4 text-neutral-500" />
										}
										className="flex-1"
									/>
									<Select
										selectedKeys={[selectedFilter]}
										onChange={(e) => setSelectedFilter(e.target.value as any)}
										className="w-48">
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
													<p className="text-xl font-bold">{students.length}</p>
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
														{
															students.filter((s) => s.score !== undefined)
																.length
														}
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
														{
															students.filter((s) => s.score === undefined)
																.length
														}
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
										<TableColumn>گروه</TableColumn>
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
													<Chip size="sm" variant="flat">
														گروه {student.groupNumber}
													</Chip>
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
														onChange={(e: { target: { value: any } }) =>
															handleScoreChange(student.id, e.target.value)
														}
														className="w-24"
														endContent={
															scores[student.id] !== undefined && (
																<Check className="w-4 h-4 text-success" />
															)
														}
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
