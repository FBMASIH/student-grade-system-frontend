"use client";

import { Button, Card, CardBody, Divider } from "@nextui-org/react";
import {
	ArrowRight,
	BarChart3,
	Bell,
	Brain,
	FileBarChart,
	Shield,
	Tablet,
} from "lucide-react";
import type { NextPage } from "next";
import Link from "next/link";

const Home: NextPage = () => {
	return (
		<div className="relative w-full overflow-x-hidden">
			{/* Hero Section */}
			<section className="min-h-[calc(100vh-80px)] relative flex flex-col justify-center items-center text-center space-y-10 py-20">
				{/* Background Gradient */}
				<div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 dark:from-primary-900/20 to-transparent -z-10" />

				<div className="animate-fade-in space-y-6 max-w-4xl mx-auto px-4">
					<h1 className="text-4xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent leading-tight">
						سیستم مدیریت نمرات دانشجویی
					</h1>
					<p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
						سامانه یکپارچه مدیریت و پیگیری نمرات دانشجویان با امکانات پیشرفته و
						رابط کاربری مدرن
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
						<Button
							as={Link}
							href="/login"
							color="primary"
							variant="shadow"
							size="lg"
							className="font-bold text-lg group relative overflow-hidden"
							startContent={
								<ArrowRight className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
							}>
							ورود به سیستم
						</Button>
						<Button
							as={Link}
							href="/about"
							variant="bordered"
							size="lg"
							className="font-bold text-lg">
							درباره سامانه
						</Button>
					</div>
				</div>

				<div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
			</section>

			{/* Features Section */}
			<section className="py-24 px-4">
				<div className="max-w-7xl mx-auto">
					<div className="text-center space-y-4 mb-16">
						<h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
							امکانات سامانه
						</h2>
						<p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
							مجموعه‌ای از امکانات پیشرفته برای مدیریت بهتر نمرات و عملکرد
							تحصیلی
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{features.map((feature, index) => (
							<Card
								key={feature.title}
								className="group hover:shadow-lg transition-all duration-300 border border-neutral-200/50 dark:border-neutral-800/50"
								style={{ animationDelay: `${index * 100}ms` }}>
								<CardBody className="p-6 space-y-4">
									<div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500">
										{feature.icon}
									</div>
									<div>
										<h3 className="text-xl font-bold">{feature.title}</h3>
										<p className="mt-2 text-neutral-600 dark:text-neutral-400 leading-relaxed">
											{feature.description}
										</p>
									</div>
								</CardBody>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="relative py-24 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-400" />
				<div className="absolute inset-0 bg-grid-white/20 bg-[size:20px_20px]" />

				<div className="relative max-w-7xl mx-auto px-4">
					<div className="grid md:grid-cols-3 gap-8 text-white text-center">
						{stats.map((stat) => (
							<div
								key={stat.label}
								className="space-y-2 backdrop-blur-sm bg-white/10 rounded-2xl p-6">
								<div className="text-4xl lg:text-5xl font-black">
									{stat.value}
								</div>
								<Divider className="my-3 bg-white/20" />
								<div className="text-lg text-white/90 font-medium">
									{stat.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
};

export default Home;

const features = [
	{
		icon: <BarChart3 className="w-6 h-6" />,
		title: "مدیریت نمرات",
		description:
			"ثبت و مدیریت آسان نمرات با رابط کاربری پیشرفته و امکانات متنوع",
	},
	{
		icon: <Tablet className="w-6 h-6" />,
		title: "دسترسی آسان",
		description: "دسترسی به سامانه از طریق تمامی دستگاه‌ها با طراحی واکنش‌گرا",
	},
	{
		icon: <FileBarChart className="w-6 h-6" />,
		title: "گزارش‌گیری",
		description: "تهیه گزارش‌های متنوع و تحلیلی از وضعیت تحصیلی دانشجویان",
	},
	{
		icon: <Bell className="w-6 h-6" />,
		title: "اطلاع‌رسانی",
		description: "اطلاع‌رسانی لحظه‌ای تغییرات نمرات و رویدادهای مهم",
	},
	{
		icon: <Shield className="w-6 h-6" />,
		title: "امنیت بالا",
		description: "حفظ امنیت اطلاعات با بالاترین استانداردهای امنیتی موجود",
	},
	{
		icon: <Brain className="w-6 h-6" />,
		title: "رابط هوشمند",
		description: "رابط کاربری هوشمند و آسان برای استفاده تمامی کاربران",
	},
];

const stats = [
	{
		value: "+۱۰۰۰",
		label: "دانشجوی فعال",
	},
	{
		value: "+۵۰",
		label: "استاد مجرب",
	},
	{
		value: "+۲۰",
		label: "دانشکده",
	},
];
