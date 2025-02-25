import { api } from "@/lib/api";
import { PaginatedResponse } from "@/lib/types/common";
import { formatDate } from "@/lib/utils/formatDate";
import {
	Button,
	Card,
	CardBody,
	Pagination,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, MessageSquare } from "react-feather";

interface Ticket {
	id: number;
	title: string;
	description: string;
	createdBy: string;
	createdAt: string;
}

export function TicketList({
	limit = undefined,
	showPagination = true,
}: {
	limit?: number;
	showPagination?: boolean;
}) {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [error, setError] = useState("");
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetchTickets(page);
	}, [page]);

	const fetchTickets = async (currentPage: number) => {
		try {
			const response = await api.getAllTickets(currentPage, 10);
			const paginatedData = response.data as PaginatedResponse;
			setTickets(paginatedData.items);
			setTotalPages(paginatedData.meta.totalPages);
			setIsLoading(false);
		} catch (err: any) {
			setError(err.message);
			setIsLoading(false);
		}
	};

	const handleViewTicket = (ticketId: number) => {
		router.push(`/dashboard/tickets/${ticketId}`);
	};

	const displayedTickets = limit ? tickets.slice(0, limit) : tickets;

	if (isLoading) return <p>Loading...</p>;

	return (
		<div className="space-y-6">
			<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
				<CardBody className="p-0">
					<Table aria-label="لیست تیکت‌ها">
						<TableHeader>
							<TableColumn>عنوان</TableColumn>
							<TableColumn>تاریخ</TableColumn>
							<TableColumn>عملیات</TableColumn>
						</TableHeader>
						<TableBody>
							{displayedTickets.map((ticket: Ticket) => (
								<TableRow key={ticket.id}>
									<TableCell className="font-medium">{ticket.title}</TableCell>
									<TableCell>
										<div className="flex items-center gap-1 text-sm text-neutral-500">
											<Clock className="w-4 h-4" />
											{formatDate(ticket.createdAt)}
										</div>
									</TableCell>
									<TableCell>
										<Button
											color="primary"
											variant="flat"
											size="sm"
											onClick={() => handleViewTicket(ticket.id)}
											endContent={<MessageSquare className="w-4 h-4" />}>
											مشاهده
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardBody>
			</Card>

			{showPagination && (
				<div className="flex justify-center">
					<Pagination
						total={totalPages}
						initialPage={1}
						page={page}
						onChange={(page) => setPage(page)}
					/>
				</div>
			)}

			{error && <p className="text-red-500">{error}</p>}
		</div>
	);
}
