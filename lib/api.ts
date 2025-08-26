import axios from "axios";
import { CourseAssignment, Group, PaginatedResponse } from "./types/common";
import {
	BulkScoreResponse,
	BulkScoreUpdate,
	ScoreResponse,
	Student,
	StudentEnrollment,
} from "./types/enrollment";
import { StudentObjection } from "./types/objection";

// Create base axios instance with CORS settings
// Use environment variable for API URL to allow deployment flexibility
const axiosInstance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
        withCredentials: true,
        headers: {
                "Content-Type": "application/json",
        },
});

// Add interceptors
axiosInstance.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
			window.location.href = "/login";
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
	professor: { name: string };
}

interface GroupResponse {
	id: number;
	groupNumber: number;
	currentEnrollment: number;
	capacity: number;
	course: {
		id: number;
		name: string;
	};
	professor: {
		id: number;
		username: string;
		role: string; // Add role property
	};
}

interface GroupStudentStatus {
	id: number;
	username: string;
	isEnrolled: boolean;
	canEnroll: boolean;
	enrollmentStatus: "enrolled" | "can_enroll" | "cannot_enroll"; // Add enrollmentStatus property
}

export const courseGroupsApi = {
        getAllGroups: (page = 1, limit = 10, search?: string) =>
                axiosInstance.get<PaginatedResponse<GroupResponse>>("/course-groups", {
                        params: { page, limit, search },
                }),

        getGroupById: (id: number) =>
                axiosInstance.get<GroupResponse>(`/course-groups/${id}`),

        createGroup: (data: {
                courseId: number;
                professorId: number;
                capacity?: number;
        }) => axiosInstance.post<GroupResponse>("/course-groups", data),

        updateGroup: (
                id: number,
                data: {
                        courseId?: number;
                        professorId?: number;
                        capacity?: number;
                }
        ) => axiosInstance.patch<GroupResponse>(`/course-groups/${id}`, data),

        deleteGroup: (id: number) => axiosInstance.delete(`/course-groups/${id}`),

        // Group Students Management
        getGroupStudents: (groupId: number) =>
                axiosInstance.get<{
                        students: Array<{
                                id: number;
                                username: string;
                                isEnrolled: boolean;
                                canEnroll: boolean;
                        }>;
                        groupInfo: {
                                id: number;
                                groupNumber: number;
                                courseName: string;
                                capacity: number;
                                currentEnrollment: number;
                        };
                }>(`/course-groups/${groupId}/students`),

        addStudentsToGroup: (groupId: number, studentIds: number[]) =>
                axiosInstance.post(`/course-groups/${groupId}/students`, { studentIds }),

        removeStudentsFromGroup: (groupId: number, studentIds: number[]) =>
                axiosInstance.delete(`/course-groups/${groupId}/students`, {
                        data: { studentIds },
                }),

        // Bulk Operations
        bulkEnrollStudents: (groupId: number, usernames: string[]) =>
                axiosInstance.post<{
                        successful: Array<{ username: string }>;
                        errors: Array<{ username: string; reason: string }>;
                }>(`/course-groups/${groupId}/bulk-enroll`, { usernames }),

        // Search students for group
        searchAvailableStudents: (groupId: number, query?: string) =>
                axiosInstance.get<{
                        students: Array<{
                                id: number;
                                username: string;
                                firstName: string;
                                lastName: string;
                                isEnrolled: boolean;
                                canEnroll: boolean;
                        }>;
                }>(`/course-groups/${groupId}/available-students`, {
                        params: { search: query },
                }),

        // Add this new method
        addStudentsToGroupByUsername: (groupId: number, usernames: string[]) =>
                axiosInstance.post<{
                        successful: Array<{ username: string }>;
                        errors: Array<{ username: string; reason: string }>;
                }>(`/course-groups/${groupId}/students/usernames`, { usernames }),
};

export const groupsApi = {
	// Group Management
	getAllGroups: (page = 1, limit = 10, search?: string) =>
		axiosInstance.get<PaginatedResponse<Group>>("/groups", {
			params: { page, limit, search },
		}),

        createGroup: (data: { name: string }) =>
                axiosInstance.post<Group>("/groups", data),

        updateGroup: (id: number, data: { name: string }) =>
                axiosInstance.patch<Group>(`/groups/${id}`, data),

        deleteGroup: (id: number) => axiosInstance.delete(`/groups/${id}`),

	removeStudentsFromGroup: (groupId: number, studentIds: number[]) =>
		axiosInstance.delete(`/groups/${groupId}/students`, {
			data: { studentIds },
		}),

	getGroupStudents: (groupId: number) =>
		axiosInstance.get<{
			students: Array<{
				id: number;
				username: string;
				isEnrolled: boolean;
				canEnroll: boolean;
			}>;
			groupInfo: {
				id: number;
				groupNumber: number;
				courseName: string;
				capacity: number;
				currentEnrollment: number;
			};
		}>(`/groups/${groupId}/students`),

	addStudentsToGroupByUsername: (groupId: number, usernames: string[]) =>
		axiosInstance.post<{
			successful: Array<{ username: string }>;
			errors: Array<{ username: string; reason: string }>;
		}>(`/groups/${groupId}/students/usernames`, { usernames }),
};

export const courseAssignmentsApi = {
	// Course Assignment Management
	getAllAssignments: (groupId: number, page = 1, limit = 10) =>
		axiosInstance.get<PaginatedResponse<CourseAssignment>>(
			`/groups/${groupId}/assignments`,
			{
				params: { page, limit },
			}
		),

	createAssignment: (data: {
		groupId: number;
		courseId: number;
		professorId: number;
		capacity: number;
	}) => axiosInstance.post<CourseAssignment>("/course-assignments", data),

	deleteAssignment: (id: number) =>
		axiosInstance.delete(`/course-assignments/${id}`),

	// Student enrollment
	// enrollStudents: (assignmentId: number, studentIds: number[]) =>
	// 	axiosInstance.post(`/course-assignments/${assignmentId}/students`, {
	// 		studentIds,
	// 	}),

	// Add this new method
	removeStudentsFromAssignment: (assignmentId: number, studentIds: number[]) =>
		axiosInstance.delete(`/course-assignments/${assignmentId}/students`, {
			data: { studentIds },
		}),

	// Get all students for a specific course assignment
	getAssignmentStudents: (assignmentId: number) =>
		axiosInstance.get<{
			enrolled: Array<{
				id: number;
				username: string;
				firstName: string;
				lastName: string;
			}>;
			available: Array<{
				id: number;
				username: string;
				firstName: string;
				lastName: string;
			}>;
		}>(`/course-assignments/${assignmentId}/students`),

	// Get available students who can be added to the course
	getAvailableStudents: (assignmentId: number, search?: string) =>
		axiosInstance.get<{
			students: Array<{
				id: number;
				username: string;
				firstName: string;
				lastName: string;
			}>;
		}>(`/course-assignments/${assignmentId}/available-students`, {
			params: { search },
		}),

	// Add students to course assignment
	enrollStudents: (assignmentId: number, studentIds: number[]) =>
		axiosInstance.post(`/course-assignments/${assignmentId}/enroll`, {
			studentIds,
		}),

	// Remove students from course assignment
	unenrollStudents: (assignmentId: number, studentIds: number[]) =>
		axiosInstance.post(`/course-assignments/${assignmentId}/unenroll`, {
			studentIds,
		}),

	// Get all students with enrollment status
	getAllStudentsWithStatus: (assignmentId: number, page = 1, limit = 10) =>
		axiosInstance.get<{
			students: Array<{
				id: number;
				username: string;
				firstName: string;
				lastName: string;
				isEnrolled: boolean;
				enrollmentId?: number;
				enrolledCourses?: Array<{
					id: number;
					name: string;
				}>;
			}>;
			total: number;
		}>(`/course-assignments/${assignmentId}/all-students`, {
			params: { page, limit },
		}),

	// Search through all students (both enrolled and available)
	searchStudents: (assignmentId: number, query: string) =>
		axiosInstance.get<{
			students: Array<{
				id: number;
				username: string;
				firstName: string;
				lastName: string;
				isEnrolled: boolean;
				enrollmentId?: number;
			}>;
		}>(`/course-assignments/${assignmentId}/search-students`, {
			params: { query },
		}),

	// Bulk enroll/unenroll operations
	bulkEnrollStudents: (assignmentId: number, studentIds: number[]) =>
		axiosInstance.post(`/course-assignments/${assignmentId}/bulk-enroll`, {
			studentIds,
		}),

	bulkUnenrollStudents: (assignmentId: number, studentIds: number[]) =>
		axiosInstance.post(`/course-assignments/${assignmentId}/bulk-unenroll`, {
			studentIds,
		}),

	bulkEnrollInCourses: (data: {
		studentIds: number[];
		courseIds: number[];
		groupId: number;
	}) => axiosInstance.post("/course-assignments/bulk-enroll-courses", data),

	// Excel import specific endpoint
	importStudentsFromExcel: (assignmentId: number, formData: FormData) =>
		axiosInstance.post(
			`/course-assignments/${assignmentId}/import-students`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		),
};

export const api = {
	// Auth APIs
	login: (username: string, password: string) =>
		axiosInstance.post("/auth/login", { username, password }),
	registerUser: (
		username: string,
		password: string,
		firstName: string,
		lastName: string
	) =>
		axiosInstance.post("/auth/register", {
			username,
			password,
			firstName,
			lastName,
		}),
	getCurrentUser: () => axiosInstance.get("/users/me"),

	// Course Management
	getAllCourses: (page: number = 1, limit: number = 10, search?: string) =>
		axiosInstance.get<PaginatedResponse<Course>>(`/courses`, {
			params: { page, limit, search },
		}),
	createEnrollment: (studentId: number, groupId: number) =>
		axiosInstance.post("/enrollments", { studentId, groupId }),
        createCourse: (data: {
                name: string;
                code: string;
        }) => axiosInstance.post<Course>("/courses", data),
	deleteCourse: (id: number) => axiosInstance.delete(`/courses/${id}`),
	getCourseById: (id: number) => axiosInstance.get(`/courses/${id}`),
	getStudentCourses: (studentId: number) =>
		axiosInstance.get(`/courses/student/${studentId}`),
	getProfessorCourses: (professorId: number) =>
		axiosInstance.get(`/courses/professor/${professorId}`),
	getCourseStudents: (courseId: number) =>
		axiosInstance.get<
			Array<{
				id: number;
				username: string;
				firstName: string;
				lastName: string;
				groupNumber: number;
				score: number | null;
			}>
		>(`/courses/${courseId}/students`),

	// Enrollment Management
	getAllEnrollments: (page: number = 1, limit: number = 10, search?: string) =>
		axiosInstance.get<PaginatedResponse<StudentEnrollment>>("/enrollments", {
			params: { page, limit, search },
		}),
	deleteEnrollment: (id: number) => axiosInstance.delete(`/enrollments/${id}`),

	// Unified endpoints for score management
	getStudentEnrollments: (studentId: string | number) =>
		axiosInstance.get<{
			enrollments: Array<{
				id: number;
				student: {
					id: number;
					username: string;
					firstName: string;
					lastName: string;
				};
				group: {
					id: number;
					groupNumber: number;
					course: {
						id: number;
						name: string;
					};
				};
				score: number | null;
			}>;
		}>(`/enrollments/${studentId}/details`),

	updateStudentScore: (enrollmentId: number, score: number) =>
		axiosInstance.patch<ScoreResponse>(`/enrollments/${enrollmentId}/score`, {
			score, // 0-100
		}),

	searchStudent: (query: string) =>
		axiosInstance.get<Student[]>(`/students`, {
			params: { q: query },
		}),

	// Bulk score operations
	bulkUpdateScores: (scores: BulkScoreUpdate[]) =>
		axiosInstance.post<BulkScoreResponse>("/scores/bulk", { scores }),

	// Score import/export
	exportScores: (filters?: {
		courseId?: number;
		groupId?: number;
		studentId?: number;
	}) =>
		axiosInstance.get("/scores/export", {
			params: filters,
			responseType: "blob",
		}),

	importScores: (formData: FormData) =>
		axiosInstance.post<{
			successful: number;
			failed: number;
			errors: Array<{
				row: number;
				message: string;
			}>;
		}>("/scores/import", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		}),

	// User Management
        getUsers: (
                page: number = 1,
                limit: number = 10,
                search?: string,
                role?: string,
                groupId?: string
        ) =>
                axiosInstance.get<
                        PaginatedResponse<{
                                id: number;
                                username: string;
                                firstName: string;
                                lastName: string;
                                role: string;
                                groupName?: string;
                        }>
                >("/users", {
                        params: {
                                page,
                                limit,
                                search,
                                role,
                                groupId,
                        },
                }),
	updateUserRole: (id: number, role: string) =>
		axiosInstance.patch(`/users/${id}/role`, { role }),
	deleteUser: (id: number) => axiosInstance.delete(`/users/${id}`),
        createUserManual: (
                username: string,
                password: string,
                firstName: string,
                lastName: string,
                role: string,
                groupId?: number
        ) =>
                axiosInstance.post("/users/manual", {
                        username,
                        password,
                        firstName,
                        lastName,
                        role,
                        ...(groupId && { groupId }),
                }),
        uploadUsersExcel: (
                formData: FormData,
                role?: string,
                groupId?: number,
                dryRun?: boolean
        ) =>
                axiosInstance.post("/users/upload-excel", formData, {
                        params: {
                                ...(role && { role }),
                                ...(groupId && { groupId }),
                                ...(dryRun && { dryRun }),
                        },
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
                        groupId?: number;
                }
        ) => axiosInstance.patch(`/users/${id}`, data),
	deleteMultipleUsers: (userIds: number[]) =>
		axiosInstance.post("/users/delete-multiple", { userIds }),
	deleteAllStudents: () => axiosInstance.get("/users/delete-students"),

	// Ticket Management
	createTicket: (data: {
		title: string;
		description: string;
		createdBy: string;
	}) => axiosInstance.post("/tickets", data),

	getAllTickets: (page: number = 1, limit: number = 10, filters?: any) =>
		axiosInstance.get<
			PaginatedResponse<{
				id: number;
				title: string;
				description: string;
				status: string;
				priority: string;
				category: string;
				createdBy: string;
				createdAt: string;
			}>
		>("/tickets", {
			params: { page, limit, ...filters },
		}),

	getTicketById: (id: number) => {
		console.log("Getting ticket by id:", id);
		return axiosInstance.get(`/tickets/${id}`);
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
	) => axiosInstance.patch(`/tickets/${id}`, data),

	deleteTicket: (id: number) => axiosInstance.delete(`/tickets/${id}`),

	addCommentToTicket: (
		ticketId: number,
		data: {
			text: string;
			createdBy: string;
		}
	) => {
		console.log("Adding comment to ticket:", ticketId, data);
		return axiosInstance.post(`/tickets/${ticketId}/comments`, data);
	},

	getCommentsForTicket: (ticketId: number) => {
		console.log("Getting comments for ticket:", ticketId);
		return axiosInstance.get(`/tickets/${ticketId}/comments`);
	},

	submitObjection: (data: {
		courseId: number;
		studentId: number;
		reason: string;
	}) => axiosInstance.post<ObjectionResponse>("/objections/submit", data),

	getStudentObjections: (studentId: number) =>
		axiosInstance.get<StudentObjection[]>(`/objections/students/${studentId}`),

	getTeacherObjections: (teacherId: number) =>
		axiosInstance.get<ObjectionResponse[]>(`/objections/teacher/${teacherId}`),

	resolveObjection: (objectionId: number, data: { resolution: string }) =>
		axiosInstance.post<{ message: string }>(
			`/objections/${objectionId}/resolve`,
			data
		),
	updateScore: (enrollmentId: number, score: number) =>
		axiosInstance.put(`/enrollments/${enrollmentId}/score`, { score }),
        submitGroupScores: (
                groupId: number,
                scores: Array<{ studentId: number; score: number }>
        ) => axiosInstance.post(`/groups/${groupId}/scores`, { scores }),
        uploadGroupScoresExcel: (
                groupId: number,
                formData: FormData,
        ) =>
                axiosInstance.post(`/groups/${groupId}/scores/upload-excel`, formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                }),
};

// Export the axios instance if needed elsewhere
export { axiosInstance };
