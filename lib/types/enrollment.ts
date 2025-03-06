export interface Student {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
}

export interface StudentEnrollment {
	id: number;
	courseId: number;
	courseName: string;
	courseCode: string;
	groupNumber: number;
	score: number | null; // Now 0-100 range
	student: {
		id: number;
		username: string;
	};
	course: {
		id: number;
		name: string;
	};
	group: {
		id: number;
		name: string;
		course: {
			name: string;
		};
	};
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
