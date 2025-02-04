"use client";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import {
	Button,
	Card,
	CardBody,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Textarea,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Grade {
	id: number;
	subject: string;
	score: number;
}

export default function StudentDashboard() {
	const { token } = useAuthStore();
	const [grades, setGrades] = useState<Grade[]>([]);
	const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
	const [objection, setObjection] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	useEffect(() => {
		if (!token) {
			router.push("/login");
			return;
		}
		api
			.getStudentGrades(1)
			.then((res) => setGrades(res.data))
			.catch((err) => setError(err.message));
	}, [token, router]);

	const handleSubmitObjection = async () => {
		if (!selectedGrade || !objection) return;
		try {
			await api.submitObjection(selectedGrade.id, objection);
			alert("اعتراض شما با موفقیت ثبت شد.");
			setObjection("");
			setSelectedGrade(null);
		} catch (err: any) {
			setError(err.message);
		}
	};

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-3xl font-bold text-primary-600">داشبورد دانشجو</h2>
				<Button
					color="primary"
					variant="flat"
					endContent={
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
					}>
					دانلود کارنامه
				</Button>
			</div>

			<Card>
				<CardBody>
					<Table aria-label="نمرات دانشجو">
						<TableHeader>
							<TableColumn>درس</TableColumn>
							<TableColumn>نمره</TableColumn>
							<TableColumn>عملیات</TableColumn>
						</TableHeader>
						<TableBody>
							{grades.map((grade) => (
								<TableRow key={grade.id}>
									<TableCell>{grade.subject}</TableCell>
									<TableCell>{grade.score}</TableCell>
									<TableCell>
										<Button
											color="danger"
											size="sm"
											onClick={() => setSelectedGrade(grade)}>
											ثبت اعتراض
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardBody>
			</Card>

			{selectedGrade && (
				<Card>
					<CardBody className="space-y-4">
						<h3 className="text-xl font-bold text-primary-600">
							اعتراض به درس: {selectedGrade.subject}
						</h3>
						<Textarea
							placeholder="دلیل اعتراض را وارد کنید..."
							value={objection}
							onChange={(e) => setObjection(e.target.value)}
						/>
						<Button
							color="primary"
							className="w-full"
							onClick={handleSubmitObjection}>
							ثبت اعتراض
						</Button>
					</CardBody>
				</Card>
			)}
		</div>
	);
}
