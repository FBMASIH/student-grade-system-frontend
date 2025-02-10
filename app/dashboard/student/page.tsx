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

interface Enrollment {
	id: number;
	group: {
		id: number;
		name: string;
		course: { name: string };
		professor: { name: string };
	};
	score?: number;
}

export default function StudentDashboard() {
	const { token } = useAuthStore();
	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [courses, setCourses] = useState([]);
	const [error, setError] = useState("");
	const router = useRouter();

	useEffect(() => {
		if (!token) {
			router.push("/login");
			return;
		}
		loadStudentData();
	}, [token, router]);

	const loadStudentData = async () => {
		try {
			const [enrollmentsRes, coursesRes] = await Promise.all([
				api.getStudentEnrollments(1), // Replace with actual student ID
				api.getStudentCourses(1), // Replace with actual student ID
			]);

			setEnrollments(enrollmentsRes.data);
			setCourses(coursesRes.data);
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
					<Table aria-label="دوره‌های دانشجو">
						<TableHeader>
							<TableColumn>دوره</TableColumn>
							<TableColumn>استاد</TableColumn>
							<TableColumn>نمره</TableColumn>
						</TableHeader>
						<TableBody>
							{enrollments.map((enrollment) => (
								<TableRow key={enrollment.id}>
									<TableCell>{enrollment.group.course.name}</TableCell>
									<TableCell>{enrollment.group.professor.name}</TableCell>
									<TableCell>{enrollment.score ?? "N/A"}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardBody>
			</Card>
		</div>
	);
}
