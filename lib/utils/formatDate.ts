// Create a new utility function file for date formatting
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

export const formatDate = (dateString: string | undefined | null) => {
	if (!dateString) return "تاریخ نامعتبر";

	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return "تاریخ نامعتبر";
		}
		return formatDistanceToNow(date, {
			addSuffix: true,
			locale: faIR, // Add Persian locale
		});
	} catch (error) {
		console.error("Date formatting error:", error);
		return "تاریخ نامعتبر";
	}
};
