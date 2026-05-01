const constraintMessages: Record<string, string> = {
	document_company_unique: 'Já existe uma transação com este documento para esta empresa.',
	building_name_unique: 'Já existe um imóvel com este nome.',
	company_name_unique: 'Já existe uma empresa com este nome.'
};

export function getDbErrorMessage(error: unknown): string | null {
	const pg = (error as any)?.cause ?? error;
	if (pg?.code === '23505') {
		const constraint = pg.constraint_name ?? pg.constraint;
		return (
			constraintMessages[constraint] ?? 'Registro duplicado: já existe um registro com estes dados.'
		);
	}
	return null;
}
