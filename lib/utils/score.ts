export const isPassingScore = (score: number | null): boolean => {
	if (score === null) return false;
	return score >= 60;
};

export const validateScore = (score: number): boolean => {
	return Number.isInteger(score) && score >= 0 && score <= 100;
};

export const getScoreColor = (
	score: number | null
): "success" | "danger" | "default" => {
	if (score === null) return "default";
	return score >= 60 ? "success" : "danger";
};
