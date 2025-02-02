"use client";

import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function Navbar() {
	const { token, logout } = useAuthStore();
	const router = useRouter();

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	return (
		<nav className="p-4 bg-white shadow-md flex justify-between items-center">
			<h1 className="text-xl font-bold text-blue-600">🎓 سیستم مدیریت نمرات</h1>
			{token ? (
				<button
					onClick={handleLogout}
					className="bg-red-500 px-4 py-2 rounded-xl text-white shadow-md hover:bg-red-600 transition">
					خروج
				</button>
			) : (
				<a
					href="/login"
					className="bg-blue-600 px-4 py-2 rounded-xl text-white shadow-md hover:bg-blue-700 transition">
					ورود
				</a>
			)}
		</nav>
	);
}
