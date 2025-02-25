"use client";

import { TicketForm } from "@/components/TicketSystem/TicketForm";
import { TicketList } from "@/components/TicketSystem/TicketList";
import { Button, Card, CardBody } from "@nextui-org/react";
import { ArrowRight, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TicketsPage() {
	const router = useRouter();

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Button
							variant="light"
							startContent={<ArrowRight className="w-4 h-4" />}
							onPress={() => router.back()}>
							بازگشت
						</Button>
						<h1 className="text-2xl font-bold">تیکت‌های پشتیبانی</h1>
					</div>
					<p className="text-neutral-600 dark:text-neutral-400">
						مدیریت تیکت‌های پشتیبانی و ارتباط با اساتید
					</p>
				</div>
			</div>

			{/* Main Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Tickets List */}
				<div className="lg:col-span-2">
					<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
						<CardBody>
							<TicketList />
						</CardBody>
					</Card>
				</div>

				{/* New Ticket Form */}
				<div>
					<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
						<CardBody>
							<div className="flex items-center gap-2 mb-4">
								<MessageSquare className="w-5 h-5 text-primary" />
								<h3 className="text-xl font-bold">ارسال تیکت جدید</h3>
							</div>
							<div className="bg-default-100 rounded-lg p-4 mb-4">
								<p className="text-sm text-neutral-600 dark:text-neutral-400">
									برای ارتباط با پشتیبانی و یا استاد راهنما می‌توانید از طریق
									فرم زیر تیکت ارسال کنید.
								</p>
							</div>
							<TicketForm />
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);
}
