import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ request }) => {
    return json({ message: 'Hello from the server!' });
}