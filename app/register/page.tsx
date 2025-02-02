"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		try {
			await api.registerUser(username, password);
			router.push("/login");
		} catch (err) {
			setError("خطایی رخ داده است. لطفاً دوباره تلاش کنید.");
		}
	};

	return (
		<div className="flex justify-center items-center min-h-screen bg-gray-100">
			<form
				onSubmit={handleRegister}
				className="bg-white p-6 rounded shadow-md w-96">
				<h2 className="text-xl font-bold mb-4">ثبت‌نام</h2>
				{error && <p className="text-red-500">{error}</p>}
				<input
					type="text"
					placeholder="نام کاربری"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="w-full p-2 border rounded mb-2"
					required
				/>
				<input
					type="password"
					placeholder="رمز عبور"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full p-2 border rounded mb-2"
					required
				/>
				<button
					type="submit"
					className="w-full bg-blue-500 text-white p-2 rounded">
					ثبت‌نام
				</button>
			</form>
		</div>
	);
}
