import { createEvent } from '../../../framework';
import type { DocRecord } from '../entities/record';

export const DocCreated = createEvent<DocRecord>('DocCreated');
