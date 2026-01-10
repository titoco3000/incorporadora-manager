//src/lib/types/api.ts
import type { InferSelectModel } from 'drizzle-orm';
import { 
    transactionType, 
    building, 
    company, 
    contract, 
    contact, 
    transaction 
} from '$lib/db/schema';

export type TransactionType = InferSelectModel<typeof transactionType>;
export type Building = InferSelectModel<typeof building>;
export type Company = InferSelectModel<typeof company>;
export type Contract = InferSelectModel<typeof contract>;
export type Contact = InferSelectModel<typeof contact>;
export type Transaction = InferSelectModel<typeof transaction>;