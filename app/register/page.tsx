"use client";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button, Card, CardBody, Input } from "@nextui-org/react";
import { ArrowRight, Lock, User, UserPlus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
	const { token } = useAuthStore();
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (token) {
			router.replace("/dashboard");
		}
	}, [token, router]);

	if (token) return null;

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await api.registerUser(username, password, firstName, lastName);
			router.push("/login");
		} catch (err) {
			setError("خطایی رخ داده است. لطفاً دوباره تلاش کنید.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-background to-neutral-100 dark:from-background dark:to-neutral-900">
			{/* Background Pattern */}
			<div className="absolute inset-0 bg-grid-neutral-100/20 dark:bg-grid-neutral-900/20 bg-[size:20px_20px] pointer-events-none" />

			<div className="w-full max-w-md z-10">
				{/* Logo Section */}
				<div className="text-center mb-8">
					<Image
						src="/logo.png"
						alt="Logo"
						width={64}
						height={64}
						className="mx-auto mb-4"
					/>
					<h1 className="text-2xl font-bold text-foreground">
						سامانه مدیریت نمرات
					</h1>
				</div>

				<Card className="backdrop-blur-[12px] border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl">
					<CardBody className="p-6 space-y-6">
						<div className="text-center space-y-2">
							<h2 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
								<UserPlus className="w-5 h-5" />
								ثبت‌نام در سامانه
							</h2>
							<p className="text-sm text-neutral-500 dark:text-neutral-400">
								برای ایجاد حساب کاربری جدید، فرم زیر را تکمیل کنید
							</p>
						</div>

						{error && (
							<div className="bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-3 rounded-lg text-sm animate-fade-in">
								{error}
							</div>
						)}

						<form onSubmit={handleRegister} className="space-y-4">
							<Input
								label="نام کاربری"
								placeholder="نام کاربری خود را وارد کنید"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								startContent={<User className="text-neutral-500 w-4 h-4" />}
								variant="bordered"
								radius="sm"
								classNames={{
									label: "text-neutral-600 dark:text-neutral-400",
									input: "text-neutral-800 dark:text-neutral-200",
								}}
								required
							/>

							<div className="grid grid-cols-2 gap-4">
								<Input
									label="نام"
									placeholder="نام خود را وارد کنید"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
									startContent={<User className="text-neutral-500 w-4 h-4" />}
									variant="bordered"
									radius="sm"
									classNames={{
										label: "text-neutral-600 dark:text-neutral-400",
										input: "text-neutral-800 dark:text-neutral-200",
									}}
									required
								/>

								<Input
									label="نام خانوادگی"
									placeholder="نام خانوادگی خود را وارد کنید"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
									startContent={<User className="text-neutral-500 w-4 h-4" />}
									variant="bordered"
									radius="sm"
									classNames={{
										label: "text-neutral-600 dark:text-neutral-400",
										input: "text-neutral-800 dark:text-neutral-200",
									}}
									required
								/>
							</div>

							<Input
								label="رمز عبور"
								type="password"
								placeholder="رمز عبور خود را وارد کنید"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								startContent={<Lock className="text-neutral-500 w-4 h-4" />}
								variant="bordered"
								radius="sm"
								classNames={{
									label: "text-neutral-600 dark:text-neutral-400",
									input: "text-neutral-800 dark:text-neutral-200",
								}}
								required
							/>

							<Button
								type="submit"
								color="primary"
								size="lg"
								className="w-full font-medium"
								startContent={<UserPlus className="w-4 h-4" />}
								isLoading={isLoading}>
								ایجاد حساب کاربری
							</Button>
						</form>

						<div className="text-center">
							<Button
								as="a"
								href="/login"
								variant="light"
								color="default"
								className="w-full font-medium"
								endContent={<ArrowRight className="w-4 h-4" />}>
								بازگشت به صفحه ورود
							</Button>
						</div>
					</CardBody>
				</Card>

				{/* Footer */}
				<p className="mt-8 text-center text-sm text-neutral-500">
					با ثبت‌نام در سامانه، شما
					<Button
						as="a"
						href="/terms"
						variant="light"
						className="text-primary font-medium mx-1">
						قوانین و مقررات
					</Button>
					را می‌پذیرید
				</p>
			</div>
		</div>
	);
}
