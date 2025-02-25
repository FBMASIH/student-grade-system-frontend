export interface PaginatedResponse {
	items: any[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface User {
	id: number;
	username: string;
	role: string;
	firstName: string; // Add firstName
	lastName: string; // Add lastName
}

export interface UserFilters {
	page: number;
	limit: number;
	search?: string;
	role?: "admin" | "teacher" | "student" | ""; // Added role filter
}

export interface Enrollment {
	id: number;
	student: {
		id: number;
		username: string;
	};
	group: {
		id: number;
		groupNumber: number;
		course: {
			id: number;
			name: string;
			code: string;
			units: number;
		};
		professor: {
			id: number;
			username: string;
		};
	};
	score: number | null;
	createdAt: Date;
	isActive: boolean;
}
