"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();
	const { setToken } = useAuthStore();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		try {
			const { data } = await api.login(username, password);
			localStorage.setItem("token", data.access_token);
			setToken(data.access_token);
			router.push("/dashboard");
		} catch (err) {
			setError("نام کاربری یا رمز عبور اشتباه است.");
		}
	};

	return (
		<div className="flex justify-center items-center min-h-screen bg-gray-100">
			<form
				onSubmit={handleLogin}
				className="bg-white p-6 rounded shadow-md w-96">
				<h2 className="text-xl font-bold mb-4">ورود</h2>
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
					ورود
				</button>
			</form>
		</div>
	);
}
