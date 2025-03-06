export interface ScoreFilter {
	key: string;
	label: string;
}

export interface SortDescriptor {
	column: string;
	direction: "ascending" | "descending";
}

export interface ScoreTableState {
	page: number;
	rowsPerPage: number;
	filterValue: string;
	sortDescriptor: SortDescriptor;
	selectedCourse: string;
}
