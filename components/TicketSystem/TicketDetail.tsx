import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { formatDate } from "@/lib/utils/formatDate";
import { Avatar, Button, Card, CardBody, Textarea } from "@nextui-org/react";
import { motion } from "framer-motion";
import { AlertCircle, Clock, MessageSquare, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Ticket {
	id: number;
	title: string;
	description: string;
	createdBy: string;
	createdAt: string;
}

interface Comment {
	id: number;
	text: string;
	createdAt: string;
	updatedAt: string;
	createdBy: {
		id: number;
		username: string;
		role: string;
	};
}

const getInitials = (name: string | undefined | null): string => {
	if (!name || typeof name !== "string") return "U";
	try {
		// Remove any whitespace and take first two characters
		const cleaned = name.trim();
		return cleaned ? cleaned.substring(0, 2).toUpperCase() : "U";
	} catch (error) {
		console.error("Error generating initials:", error);
		return "U";
	}
};

export function TicketDetail({ ticketId }: { ticketId: number }) {
	const [ticket, setTicket] = useState<Ticket | null>(null);
	const [comments, setComments] = useState<Comment[]>([]);
	const [newComment, setNewComment] = useState("");
	const [error, setError] = useState("");

        const fetchTicket = useCallback(async () => {
                try {
                        const response = await api.getTicketById(ticketId);
                        setTicket(response.data);
                } catch (err: any) {
                        setError(err.message || "Failed to fetch ticket");
                }
        }, [ticketId]);

        const fetchComments = useCallback(async () => {
                try {
                        const response = await api.getCommentsForTicket(ticketId);
                        if (!response.data) {
                                setComments([]);
                                return;
                        }
                        setComments(response.data);
                } catch (err: any) {
                        setError(err.message || "Failed to fetch comments");
                        setComments([]);
                }
        }, [ticketId]);

        useEffect(() => {
                void fetchTicket();
                void fetchComments();
        }, [fetchComments, fetchTicket]);

	const handleAddComment = async () => {
                try {
                        await api.addCommentToTicket(ticketId, {
                                text: newComment,
                                createdBy: "currentUserId", // Replace with actual user ID
                        });
                        setNewComment("");
                        await fetchComments();
                } catch (err: any) {
                        setError(err.message);
                }
        };

	// Sort comments to show newest at bottom
	const sortedComments = [...comments].sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	);

        if (!ticket) {
                return (
                        <div className="flex items-center justify-center p-8">
                                <div className="text-center space-y-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
					<p>Loading ticket details...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6 p-4">
			{/* Ticket Header Card with animation */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}>
				<Card className="border border-neutral-200/50 dark:border-neutral-800/50 shadow-lg backdrop-blur-sm">
					<CardBody className="space-y-4">
						<div className="flex justify-between items-start">
							<div>
								<h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
									{ticket?.title}
								</h2>
								<p className="text-neutral-600 dark:text-neutral-400 mt-1">
									{ticket?.description}
								</p>
							</div>
						</div>
					</CardBody>
				</Card>
			</motion.div>

			{/* Comments Section with modern chat-like interface */}
			<div className="space-y-4">
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.2 }}
					className="flex items-center gap-2 mb-6">
					<MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
					<h3 className="text-xl font-bold text-primary-600 dark:text-primary-400">
						پاسخ‌ها
					</h3>
				</motion.div>

				{/* Chat container with smooth scroll */}
				<div className="space-y-4 max-h-[600px] overflow-y-auto px-2 scroll-smooth">
					{sortedComments.map((comment, index) => (
						<motion.div
							key={comment.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.1 }}
							className={`flex ${
								comment.createdBy.role === "admin"
									? "justify-start"
									: "justify-end"
							}`}>
							<Card
								className={`border transition-all hover:shadow-md ${
									comment.createdBy.role === "admin"
										? "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
										: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800"
								} max-w-md`}>
								<CardBody className="p-4">
									<div className="flex gap-4">
										<Avatar
											classNames={{
												base: "w-10 h-10 transition-transform hover:scale-105",
												fallback: "bg-primary/10 text-primary font-semibold",
											}}
											name={comment.createdBy.username}
											fallback={
												<span>{getInitials(comment.createdBy.username)}</span>
											}
										/>
										<div className="flex-1">
											<div className="flex justify-between items-start">
												<span className="font-medium text-neutral-800 dark:text-neutral-200">
													{comment.createdBy.username}
												</span>
												<div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
													<Clock className="w-4 h-4 mr-1" />
													{formatDate(comment.createdAt)}
												</div>
											</div>
											<p className="mt-2 text-neutral-700 dark:text-neutral-300">
												{comment.text}
											</p>
										</div>
									</div>
								</CardBody>
							</Card>
						</motion.div>
					))}
				</div>

				{/* Comment Form with animation */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.4 }}>
					<Card className="border border-neutral-200/50 dark:border-neutral-800/50 shadow-md sticky bottom-0 backdrop-blur-sm">
						<CardBody className="p-4">
							<div className="flex gap-4">
								<Avatar
									classNames={{
										base: "w-10 h-10 transition-transform hover:scale-105",
										fallback: "bg-primary/10 text-primary font-semibold",
									}}
									name={useAuthStore.getState().user?.id?.toString()}
									fallback={
										<span>{getInitials(useAuthStore.getState().user?.id?.toString())}</span>
									}
								/>
								<div className="flex-1">
                                                                        <Textarea
                                                                                placeholder="پاسخ خود را بنویسید..."
                                                                                value={newComment}
                                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                                minRows={2}
                                                                                className="mb-3 transition-all focus:scale-[1.01]"
                                                                                aria-label="متن پاسخ جدید"
                                                                        />
									<div className="flex justify-end">
										<Button
											color="primary"
											endContent={<Send className="w-4 h-4" />}
											onClick={handleAddComment}
											isDisabled={!newComment.trim()}
											className="transition-transform hover:scale-105">
											ارسال پاسخ
										</Button>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				</motion.div>
			</div>

			{/* Error Toast with animation */}
			{error && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					className="fixed bottom-6 right-6 bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 p-4 rounded-xl shadow-lg flex items-center gap-3">
					<AlertCircle className="w-5 h-5" />
					<p>{error}</p>
				</motion.div>
			)}
		</div>
	);
}
