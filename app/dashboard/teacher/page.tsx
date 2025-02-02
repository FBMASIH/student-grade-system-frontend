"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Objection {
	id: number;
	grade: { id: number; subject: string; score: number };
	reason: string;
	resolved: boolean;
}

export default function TeacherDashboard() {
	const { token } = useAuthStore();
	const [studentId, setStudentId] = useState("");
	const [subject, setSubject] = useState("");
	const [score, setScore] = useState("");
	const [objections, setObjections] = useState<Objection[]>([]);
	const [error, setError] = useState("");
	const router = useRouter();

	useEffect(() => {
		if (!token) {
			router.push("/login");
			return;
		}
		fetchObjections();
	}, [token, router]);

	const fetchObjections = async () => {
		try {
			const res = await api.getObjections();
			setObjections(res.data);
		} catch (err: any) {
			setError(err.message);
		}
	};

	const handleAssignGrade = async () => {
		if (!studentId || !subject || !score) return;
		try {
			await api.assignGrade(Number(studentId), subject, Number(score));
			alert("نمره با موفقیت ثبت شد");
			setStudentId("");
			setSubject("");
			setScore("");
		} catch (err: any) {
			setError(err.message);
		}
	};

	const handleResolveObjection = async (id: number) => {
		try {
			await api.resolveObjection(id);
			alert("اعتراض بررسی شد");
			fetchObjections();
		} catch (err: any) {
			setError(err.message);
		}
	};

	return (
		<div className="w-full max-w-4xl">
			<h2 className="text-3xl font-bold text-blue-600 mb-6">داشبورد استاد</h2>
			{error && <p className="text-red-500 mb-4">{error}</p>}

			<div className="bg-white p-6 rounded-lg shadow-md mb-8">
				<h3 className="text-2xl font-bold text-blue-600 mb-4">
					ثبت نمره دانشجو
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<input
						type="number"
						placeholder="شناسه دانشجو"
						value={studentId}
						onChange={(e) => setStudentId(e.target.value)}
						className="p-2 border rounded"
					/>
					<input
						type="text"
						placeholder="نام درس"
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						className="p-2 border rounded"
					/>
					<input
						type="number"
						placeholder="نمره"
						value={score}
						onChange={(e) => setScore(e.target.value)}
						className="p-2 border rounded"
					/>
				</div>
				<button
					onClick={handleAssignGrade}
					className="mt-4 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
					ثبت نمره
				</button>
			</div>

			<div className="bg-white p-6 rounded-lg shadow-md">
				<h3 className="text-2xl font-bold text-blue-600 mb-4">لیست اعتراضات</h3>
				{objections.length === 0 ? (
					<p className="text-gray-600">هیچ اعتراضی موجود نیست</p>
				) : (
					<table className="w-full border rounded-lg overflow-hidden">
						<thead className="bg-blue-600 text-white">
							<tr>
								<th className="p-3">درس</th>
								<th className="p-3">نمره</th>
								<th className="p-3">دلیل اعتراض</th>
								<th className="p-3">وضعیت</th>
								<th className="p-3">عملیات</th>
							</tr>
						</thead>
						<tbody>
							{objections.map((obj) => (
								<tr key={obj.id} className="border-b">
									<td className="p-3">{obj.grade.subject}</td>
									<td className="p-3">{obj.grade.score}</td>
									<td className="p-3">{obj.reason}</td>
									<td className="p-3">
										{obj.resolved ? "بررسی شده" : "در انتظار"}
									</td>
									<td className="p-3">
										{!obj.resolved && (
											<button
												onClick={() => handleResolveObjection(obj.id)}
												className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition">
												بررسی
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
