export interface Student {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
}

export interface StudentEnrollment {
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
}

export interface ScoreResponse {
	id: number;
	studentId: number;
	courseName: string;
	score: number;
	success: boolean;
}

export interface BulkScoreUpdate {
	enrollmentId: number;
	score: number;
}

export interface BulkScoreResponse {
	successful: number;
	failed: number;
	errors: Array<{
		enrollmentId: number;
		message: string;
	}>;
}
