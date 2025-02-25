import { Card, CardBody, cn } from "@nextui-org/react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800"
			dir="rtl">
			<div className="max-w-[1400px] mx-auto p-4 lg:p-6 xl:p-8 space-y-6">
				{children}
			</div>
		</div>
	);
}

export function DashboardCard({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Card
			className={cn(
				"border border-neutral-200/50 dark:border-neutral-800/50",
				className
			)}>
			<CardBody>{children}</CardBody>
		</Card>
	);
}

export function DashboardHeader({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
			<div className="space-y-1.5">
				<h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold">{title}</h1>
				{description && (
					<p className="text-neutral-600 dark:text-neutral-400">
						{description}
					</p>
				)}
			</div>
			{children}
		</div>
	);
}
