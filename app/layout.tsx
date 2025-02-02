import Navbar from "@/components/Navbar";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "سیستم مدیریت نمرات",
	description: "سامانه مدیریت کارنامه دانشجویان",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="fa">
			<body
				dir="rtl"
				className="bg-gradient-to-b from-blue-500 to-white min-h-screen">
				<Navbar />
				<main className="container mx-auto p-6 flex justify-center">
					{children}
				</main>
			</body>
		</html>
	);
}
