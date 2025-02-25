import { TicketDetail } from "@/components/TicketSystem/TicketDetail";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function TicketDetailPage() {
	const router = useRouter();
	const [ticketId, setTicketId] = useState<number | null>(null);

	useEffect(() => {
		if (router.isReady) {
			const { ticketId } = router.query;
			if (ticketId) {
				setTicketId(parseInt(ticketId as string));
			}
		}
	}, [router.isReady, router.query]);

	if (!ticketId) return <p>Loading...</p>;

	return <TicketDetail ticketId={ticketId} />;
}
