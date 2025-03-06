export interface StudentObjection {
	id: number;
	courseName: string;
	reason: string;
	status: string;
	response: string | null;
	createdAt: string;
	resolved: boolean;
}

export interface StudentObjectionsResponse {
	items: StudentObjection[];
}
