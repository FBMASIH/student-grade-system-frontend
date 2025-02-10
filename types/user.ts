export interface User {
	id: number;
	username: string;
	role: "admin" | "teacher" | "student";
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface UserFilters {
	page: number;
	limit: number;
	search?: string;
	role?: "admin" | "teacher" | "student" | ""; // Added role filter
}
