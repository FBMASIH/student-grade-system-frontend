import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store"; // Import useAuthStore
import { Button, Input, Textarea } from "@nextui-org/react";
import { Send } from "lucide-react";
import { useState } from "react";

export function TicketForm({
	onTicketCreated,
}: {
	onTicketCreated?: () => void;
}) {
	const { user } = useAuthStore(); // Get the current user from the store
	const [formData, setFormData] = useState({
		title: "",
		description: "",
	});
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (!user) {
				setError("User is not authenticated");
				return;
			}
			await api.createTicket({
				title: formData.title,
				description: formData.description,
				createdBy: user.id, // Use the current user's ID
			});
			onTicketCreated?.();
			setFormData({
				title: "",
				description: "",
			});
		} catch (err: any) {
			setError(err.message);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<Input
				label="عنوان"
				placeholder="عنوان تیکت را وارد کنید"
				value={formData.title}
				onChange={(e) => setFormData({ ...formData, title: e.target.value })}
				required
			/>
			<Textarea
				label="توضیحات"
				placeholder="توضیحات تیکت را وارد کنید"
				value={formData.description}
				onChange={(e) =>
					setFormData({ ...formData, description: e.target.value })
				}
				minRows={3}
				required
			/>
			
			<Button
				type="submit"
				color="primary"
				className="w-full"
				startContent={<Send className="w-4 h-4" />}>
				ارسال تیکت
			</Button>
			{error && <p className="text-red-500">{error}</p>}
		</form>
	);
}
