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
	login: (username: string, password: string) =>
		apiClient.post("/auth/login", { username, password }),

	registerUser: (username: string, password: string) =>
		apiClient.post("/auth/register", { username, password }),

	getCurrentUser: () => apiClient.get("/users/me"),

	getStudentGrades: (studentId: number) =>
		apiClient.get(`/grades/student/${studentId}`),

	submitObjection: (gradeId: number, reason: string) =>
		apiClient.post("/objections/submit", { gradeId, reason }),

	getObjections: () => apiClient.get("/objections"),

	resolveObjection: (id: number) =>
		apiClient.patch(`/objections/resolve/${id}`),

	assignGrade: (studentId: number, subject: string, score: number) =>
		apiClient.post("/grades/assign", { studentId, subject, score }),

	// مدیریت کاربران توسط مدیر کل:
	getUsers: () => apiClient.get("/users"),
	updateUserRole: (id: number, role: string) =>
		apiClient.patch(`/users/${id}/role`, { role }),
	deleteUser: (id: number) => apiClient.delete(`/users/${id}`),
	createUserManual: (username: string, password: string, role: string) =>
		apiClient.post("/users/manual", { username, password, role }),
	uploadUsersExcel: (formData: FormData) =>
		apiClient.post("/users/upload", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		}),
	updateUser: (id: number, data: { username?: string; password?: string; role?: string }) =>
		apiClient.patch(`/users/${id}`, data),
};
