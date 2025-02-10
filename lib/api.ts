import axios from "axios";

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

export const api = {
	// Auth APIs
	login: (username: string, password: string) =>
		apiClient.post("/auth/login", { username, password }),
	registerUser: (username: string, password: string) =>
		apiClient.post("/auth/register", { username, password }),
	getCurrentUser: () => apiClient.get("/users/me"),

	// Course Management
	getAllCourses: (page: number = 1, limit: number = 10) =>
		apiClient.get(`/courses?page=${page}&limit=${limit}`),
	getCourseById: (id: number) => apiClient.get(`/courses/${id}`),
	getStudentCourses: (studentId: number) =>
		apiClient.get(`/courses/student/${studentId}`),
	getProfessorCourses: (professorId: number) =>
		apiClient.get(`/courses/professor/${professorId}`),

	// Enrollment Management
	createEnrollment: (studentId: number, groupId: number) =>
		apiClient.post("/enrollments", { studentId, groupId }),
	updateEnrollmentGrade: (id: number, score: number) =>
		apiClient.patch(`/enrollments/${id}/grade`, { score }),
	getStudentEnrollments: (studentId: number) =>
		apiClient.get(`/enrollments/student/${studentId}`),
	getGroupEnrollments: (groupId: number) =>
		apiClient.get(`/enrollments/group/${groupId}`),

	// User Management
	getUsers: (
		page: number = 1,
		limit: number = 10,
		search?: string,
		role?: string
	) =>
		apiClient.get("/users", {
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
	createUserManual: (username: string, password: string, role: string) =>
		apiClient.post("/users/manual", { username, password, role }),
	uploadUsersExcel: (formData: FormData) =>
		apiClient.post("/users/upload", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		}),
	updateUser: (
		id: number,
		data: { username?: string; password?: string; role?: string }
	) => apiClient.patch(`/users/${id}`, data),
};
