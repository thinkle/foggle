// Get the index of the puzzle based on the day!

const magicDate = new Date(2025, 0, 5);

export const getDayIndex = (date = new Date()) => {
	const daysBetween = (date.getTime() - magicDate.getTime()) / (1000 * 60 * 60 * 24);
	return Math.floor(daysBetween);
};
