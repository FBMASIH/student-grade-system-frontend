"use client";

import { TicketDetail } from "@/components/TicketSystem/TicketDetail";
import { useParams } from "next/navigation";

export default function TicketDetailPage() {
	const params = useParams();
	const ticketId = params?.ticketId
		? parseInt(params.ticketId as string)
		: null;

	if (!ticketId) return <p>Loading...</p>;

	return <TicketDetail ticketId={ticketId} />;
}
