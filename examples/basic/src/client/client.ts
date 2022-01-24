import createAPIClient from 'nextkit/client';

import type Time from '../pages/api/time';

export const client = createAPIClient('http://localhost:3000/api');

// Define an endpoint to access with methods.
// notice how there is not `.patch` method on this `time` object
// as we don't define a PATCH handler inside of the api file! woah!!
export const time = client.define<typeof Time>('/time');
