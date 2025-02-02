import axios from "axios";

const API_URL = "http://localhost:3001";

const apiClient = axios.create({
	baseURL: API_URL,
	headers: { "Content-Type": "application/json" },
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
			}
		}
		return Promise.reject(error);
	}
);

export const api = {
	getUsers: () => apiClient.get("/users"),

	updateUserRole: (id: string, role: string) =>
		apiClient.patch(`/users/${id}/role`, { role }),

	deleteUser: (id: string) => apiClient.delete(`/users/${id}`),

	login: (username: string, password: string) =>
		apiClient.post("/auth/login", { username, password }),

	registerUser: (username: string, password: string) =>
		apiClient.post("/users/register", { username, password }),

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

	uploadUsersExcel: (formData: FormData) =>
		apiClient.post("/users/upload", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		}),
};
