export const tableStyles = {
	wrapper: "overflow-x-auto",
	base: "min-w-full",
	header: "bg-neutral-50/50 dark:bg-neutral-800/50 sticky top-0 z-10",
	headerCell: [
		"text-right",
		"bg-transparent",
		"text-sm",
		"font-medium",
		"text-neutral-700 dark:text-neutral-300",
		"p-4",
		"whitespace-nowrap",
		"first:pr-6 last:pl-6",
	].join(" "),
	cell: [
		"text-right",
		"p-4",
		"text-neutral-600 dark:text-neutral-400",
		"border-b border-neutral-200/50 dark:border-neutral-800/50",
		"first:pr-6 last:pl-6",
	].join(" "),
	loadingWrapper: "flex items-center justify-center p-8",
	emptyWrapper: "flex flex-col items-center justify-center py-12",
	emptyIcon: "w-12 h-12 text-neutral-400 mb-4",
	emptyText: "text-lg font-medium text-neutral-600 dark:text-neutral-400",
	emptyDescription: "text-sm text-neutral-500 mt-2 text-center",
};

export const modalStyles = {
	base: "border border-neutral-200/50 dark:border-neutral-800/50",
	header: "border-b border-neutral-200/50 dark:border-neutral-800/50",
	body: "p-6",
	footer: "border-t border-neutral-200/50 dark:border-neutral-800/50",
};
