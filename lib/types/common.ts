export interface PaginatedResponse<T = any> {
	items: T[];
	meta: {
		totalItems: number;
		itemCount: number;
		itemsPerPage: number;
		totalPages: number;
		currentPage: number;
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

export interface Group {
	id: number;
	name: string; // e.g., "FIATA-1"
	createdAt: Date;
}

export interface Course {
	id: number;
	name: string; // e.g., "Mathematics"
	code: string; // e.g., "MATH101"
	units: number;
	department?: string;
}

export interface CourseAssignment {
	id: number;
	groupId: number;
	courseId: number;
	professorId: number;
	capacity: number;
	currentEnrollment: number;
	course: Course;
	professor: {
		id: number;
		username: string;
		role: string;
	};
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
