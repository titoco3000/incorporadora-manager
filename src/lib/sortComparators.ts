export const strCompare = (a: string | null | undefined, b: string | null | undefined): number => {
	if (a === b) return 0;
	if (!a) return 1;
	if (!b) return -1;
	return a.localeCompare(b);
};

export const numCompare = (a: number | null | undefined, b: number | null | undefined): number => {
	if (a === b) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	return a - b;
};

export const dateCompare = (
	a: Date | string | null | undefined,
	b: Date | string | null | undefined
): number => {
	if (a === b) return 0;
	if (!a) return 1;
	if (!b) return -1;
	return new Date(a).getTime() - new Date(b).getTime();
};

export const boolCompare = (
	a: boolean | null | undefined,
	b: boolean | null | undefined
): number => {
	if (a === b) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	return a ? -1 : 1;
};

export const companyCompare = (a: number, b: number): number => {
	return numCompare(a, b);
};

export const buildingCompare = (a: number, b: number): number => {
	return numCompare(a, b);
};

export const transactionTypeCompare = (a: number, b: number): number => {
	return numCompare(a, b);
};
