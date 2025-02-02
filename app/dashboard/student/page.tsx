"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

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
		api.getStudentGrades(1)
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
		<div className="w-full max-w-3xl">
			<h2 className="text-3xl font-bold text-blue-600 mb-6">داشبورد دانشجو</h2>
			{error && <p className="text-red-500 mb-4">{error}</p>}
			<table className="w-full border rounded-lg overflow-hidden">
				<thead className="bg-blue-600 text-white">
					<tr>
						<th className="p-3">درس</th>
						<th className="p-3">نمره</th>
						<th className="p-3">اعتراض</th>
					</tr>
				</thead>
				<tbody>
					{grades.map((grade) => (
						<tr key={grade.id} className="border-b">
							<td className="p-3">{grade.subject}</td>
							<td className="p-3">{grade.score}</td>
							<td className="p-3">
								<button
									onClick={() => setSelectedGrade(grade)}
									className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">
									اعتراض
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{selectedGrade && (
				<div className="mt-6 p-4 bg-white rounded-lg shadow-md">
					<h3 className="text-xl font-bold text-blue-600 mb-3">
						اعتراض به درس: {selectedGrade.subject}
					</h3>
					<textarea
						className="w-full p-2 border rounded mb-3"
						placeholder="دلیل اعتراض را وارد کنید..."
						value={objection}
						onChange={(e) => setObjection(e.target.value)}
					/>
					<button
						onClick={handleSubmitObjection}
						className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
						ثبت اعتراض
					</button>
				</div>
			)}
		</div>
	);
}
