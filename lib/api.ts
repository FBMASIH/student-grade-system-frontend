import axios from "axios";
import { PaginatedResponse, User } from "./types/common";
import {
	BulkScoreResponse,
	BulkScoreUpdate,
	ScoreResponse,
	Student,
	StudentEnrollment,
} from "./types/enrollment";
import { StudentObjection } from "./types/objection";

const API_URL = "http://localhost:3001/";

const apiClient = axios.create({
	baseURL: API_URL,
	headers: { "Content-Type": "application/json" },
	timeout: 10000,
});

apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response) {
			if (error.response.status === 401) {
				localStorage.removeItem("token");
				window.location.href = "/login";
			}
		}
		return Promise.reject(error);
	}
);

interface ObjectionResponse {
	id: number;
	course: {
		id: number;
		name: string;
	};
	student: {
		id: number;
		name: string;
	};
	reason: string;
	resolved: boolean;
	response: string | null;
}

interface Course {
	id: number;
	name: string;
	code: string;
	subject: string;
	groups: Array<{
		// ...existing group properties...
	}>;
}

export const api = {
	// Auth APIs
	login: (username: string, password: string) =>
		apiClient.post("/auth/login", { username, password }),
	registerUser: (
		username: string,
		password: string,
		firstName: string,
		lastName: string
	) =>
		apiClient.post("/auth/register", {
			username,
			password,
			firstName,
			lastName,
		}),
	getCurrentUser: () => apiClient.get("/users/me"),

	// Course Management
	getAllCourses: (page: number = 1, limit: number = 10, search?: string) =>
		apiClient.get<PaginatedResponse>(`/courses`, {
			params: { page, limit, search },
		}),
	createCourse: (data: { name: string; code: string }) =>
		apiClient.post("/courses", data),
	updateCourse: (
		id: number,
		data: {
			name?: string;
			code?: string;
		}
	) => apiClient.patch(`/courses/${id}`, data),
	deleteCourse: (id: number) => apiClient.delete(`/courses/${id}`),
	getCourseById: (id: number) => apiClient.get(`/courses/${id}`),
	getStudentCourses: (studentId: number) =>
		apiClient.get(`/courses/student/${studentId}`),
	getProfessorCourses: (professorId: number) =>
		apiClient.get(`/courses/professor/${professorId}`),
	getCourseStudents: (courseId: number) =>
		apiClient.get<
			Array<{
				id: number;
				username: string;
				firstName: string;
				lastName: string;
				groupNumber: number;
				score: number | null;
			}>
		>(`/courses/${courseId}/students`),

	// Course Groups Management
	getAllCourseGroups: (page: number = 1, limit: number = 10, search?: string) =>
		apiClient.get<PaginatedResponse>("/course-groups", {
			params: { page, limit, search },
		}),
	getCourseGroupById: (id: number) => apiClient.get(`/course-groups/${id}`),
	createCourseGroup: (data: { courseId: number; professorId: number }) =>
		apiClient.post("/course-groups", data),
	updateCourseGroup: (
		id: number,
		data: {
			groupNumber?: number;
			capacity?: number;
			courseId?: number;
			professorId?: number;
		}
	) => apiClient.patch(`/course-groups/${id}`, data),
	deleteCourseGroup: (id: number) => apiClient.delete(`/course-groups/${id}`),
	addStudentsToGroup: (groupId: number, studentIds: number[]) =>
		apiClient.post(`/course-groups/${groupId}/students`, { studentIds }),
	getStudentsInGroup: (groupId: number) =>
		apiClient.get<User[]>(`/course-groups/${groupId}/students`),
	getGroupStudentsStatus: (groupId: number) =>
		apiClient.get(`/course-groups/${groupId}/students-status`),
	addStudentsToGroupByUsername: (groupId: number, usernames: string[]) =>
		apiClient.post<{
			successful: Array<{ username: string }>;
			errors: Array<{ username: string; reason: string }>;
		}>(`/course-groups/${groupId}/students/bulk`, { usernames }),

	// Enrollment Management
	getAllEnrollments: (page: number = 1, limit: number = 10, search?: string) =>
		apiClient.get<PaginatedResponse>("/enrollments", {
			params: { page, limit, search },
		}),
	createEnrollment: (studentId: number, groupId: number) =>
		apiClient.post("/enrollments", { studentId, groupId }),
	deleteEnrollment: (id: number) => apiClient.delete(`/enrollments/${id}`),

	// Unified endpoints for score management
	getStudentEnrollments: (studentId: string | number) =>
		apiClient.get<{
			enrollments: StudentEnrollment[];
		}>(`/api/enrollments/${studentId}/details`),

	updateStudentScore: (enrollmentId: number, score: number) =>
		apiClient.patch<ScoreResponse>(`/api/enrollments/${enrollmentId}/score`, {
			score, // 0-100
		}),

	searchStudent: (query: string) =>
		apiClient.get<Student[]>(`/api/students`, {
			params: { q: query },
		}),

	// Bulk score operations
	bulkUpdateScores: (scores: BulkScoreUpdate[]) =>
		apiClient.post<BulkScoreResponse>("/api/scores/bulk", { scores }),

	// Score import/export
	exportScores: (filters?: {
		courseId?: number;
		groupId?: number;
		studentId?: number;
	}) =>
		apiClient.get("/api/scores/export", {
			params: filters,
			responseType: "blob",
		}),

	importScores: (formData: FormData) =>
		apiClient.post<{
			successful: number;
			failed: number;
			errors: Array<{
				row: number;
				message: string;
			}>;
		}>("/api/scores/import", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		}),

	// User Management
	getUsers: (
		page: number = 1,
		limit: number = 10,
		search?: string,
		role?: string
	) =>
		apiClient.get<PaginatedResponse>("/users", {
			params: {
				page,
				limit,
				search,
				role,
			},
		}),
	updateUserRole: (id: number, role: string) =>
		apiClient.patch(`/users/${id}/role`, { role }),
	deleteUser: (id: number) => apiClient.delete(`/users/${id}`),
	createUserManual: (
		username: string,
		password: string,
		firstName: string,
		lastName: string,
		role: string
	) =>
		apiClient.post("/users/manual", {
			username,
			password,
			firstName,
			lastName,
			role,
		}),
	uploadUsersExcel: (formData: FormData) =>
		apiClient.post("/users/upload-excel", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		}),
	updateUser: (
		id: number,
		data: {
			username?: string;
			password?: string;
			firstName?: string;
			lastName?: string;
			role?: string;
		}
	) => apiClient.patch(`/users/${id}`, data),
	deleteMultipleUsers: (userIds: number[]) =>
		apiClient.post("/users/delete-multiple", { userIds }),
	deleteAllStudents: () => apiClient.get("/users/delete-students"),

	// Ticket Management
	createTicket: (data: {
		title: string;
		description: string;
		createdBy: string;
	}) => apiClient.post("/tickets", data),

	getAllTickets: (page: number = 1, limit: number = 10, filters?: any) =>
		apiClient.get<PaginatedResponse>("/tickets", {
			params: { page, limit, ...filters },
		}),

	getTicketById: (id: number) => {
		console.log("Getting ticket by id:", id);
		return apiClient.get(`/tickets/${id}`);
	},

	updateTicket: (
		id: number,
		data: {
			title?: string;
			description?: string;
			category?: string;
			priority?: string;
			status?: string;
		}
	) => apiClient.patch(`/tickets/${id}`, data),

	deleteTicket: (id: number) => apiClient.delete(`/tickets/${id}`),

	addCommentToTicket: (
		ticketId: number,
		data: {
			text: string;
			createdBy: string;
		}
	) => {
		console.log("Adding comment to ticket:", ticketId, data);
		return apiClient.post(`/tickets/${ticketId}/comments`, data);
	},

	getCommentsForTicket: (ticketId: number) => {
		console.log("Getting comments for ticket:", ticketId);
		return apiClient.get(`/tickets/${ticketId}/comments`);
	},

	submitObjection: (data: {
		courseId: number;
		studentId: number;
		reason: string;
	}) => apiClient.post<ObjectionResponse>("/objections/submit", data),

	getStudentObjections: (studentId: number) =>
		apiClient.get<StudentObjection[]>(`/objections/students/${studentId}`),

	getTeacherObjections: (teacherId: number) =>
		apiClient.get<ObjectionResponse[]>(`/objections/teacher/${teacherId}`),

	resolveObjection: (objectionId: number, data: { resolution: string }) =>
		apiClient.post<{ message: string }>(
			`/objections/${objectionId}/resolve`,
			data
		),
	updateScore: (enrollmentId: number, score: number) =>
		apiClient.put(`/enrollments/${enrollmentId}/score`, { score }),
};