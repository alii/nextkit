import createAPIClient from 'nextkit/client';

import type Time from '../pages/api/time';

export const client = createAPIClient('/api');

const time = client.endpoint<typeof Time>();
const get = time;
