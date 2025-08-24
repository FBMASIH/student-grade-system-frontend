"use client";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button, Card, CardBody, CircularProgress, Divider, Input } from "@nextui-org/react";
import { ArrowRight, HelpCircle, Lock, LogIn, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
        const { token, setToken, setUser } = useAuthStore();

        // Check auth status and redirect accordingly
        useEffect(() => {
                const checkAuth = async () => {
                        if (token) {
                                try {
                                        const { data } = await api.getCurrentUser();
                                        if (data.role) {
                                                setUser({ id: data.id, role: data.role });
                                                router.replace(`/dashboard/${data.role}`);
                                        } else {
                                                useAuthStore.getState().logout();
                                        }
                                } catch {
                                        useAuthStore.getState().logout();
                                }
                        }
                };

                if (token && pathname === "/login") {
                        checkAuth();
                }
        }, [token, router, pathname, setUser]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
                        const { data } = await api.login(username, password);
                        setToken(data.access_token);
                        setUser({ id: data.id, role: data.role });
                        router.push(`/dashboard/${data.role}`);
		} catch (err: any) {
			setError(
				err.response?.data?.message || "نام کاربری یا رمز عبور اشتباه است."
			);
		} finally {
			setIsLoading(false);
		}
	};

        // Show a loading state while verifying existing token
        if (token)
                return (
                        <div className="h-screen w-full flex items-center justify-center">
                                <CircularProgress size="lg" color="primary" aria-label="Loading..." />
                        </div>
                );

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-background to-neutral-100 dark:from-background dark:to-neutral-900">
			<div className="absolute inset-0 bg-grid-neutral-100/20 dark:bg-grid-neutral-900/20 bg-[size:20px_20px] pointer-events-none" />

			<div className="w-full max-w-md z-10">
				<Card className="backdrop-blur-[12px] border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl">
					<CardBody className="p-6 space-y-6">
						<div className="text-center space-y-2">
							<h2 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
								<LogIn className="w-5 h-5" />
								ورود به سامانه
							</h2>
							<p className="text-sm text-neutral-500 dark:text-neutral-400">
								برای دسترسی به پنل کاربری خود وارد شوید
							</p>
						</div>

						{error && (
							<div className="bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-3 rounded-lg text-sm animate-fade-in">
								{error}
							</div>
						)}

						<form onSubmit={handleLogin} className="space-y-4">
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
								startContent={<LogIn className="w-4 h-4" />}
								isLoading={isLoading}>
								ورود به سامانه
							</Button>
						</form>

						<div className="relative">
							<Divider className="my-4" />
							<span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm text-neutral-500">
								یا
							</span>
						</div>

						<div className="text-center">
							<Button
								as="a"
								href="/register"
								variant="flat"
								color="default"
								className="w-full font-medium"
								endContent={<ArrowRight className="w-4 h-4" />}>
								ایجاد حساب کاربری جدید
							</Button>
						</div>
					</CardBody>
				</Card>

				<p className="mt-8 text-center text-sm text-neutral-500">
					نیاز به راهنمایی دارید؟{" "}
					<Button
						as="a"
						href="/help"
						variant="light"
						className="text-primary font-medium"
						startContent={<HelpCircle className="w-4 h-4" />}>
						مرکز پشتیبانی
					</Button>
				</p>
			</div>
		</div>
	);
}
