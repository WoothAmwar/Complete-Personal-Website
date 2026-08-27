import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const rawProfile = req.cookies.profile;
    let googleId: string | undefined;
    if (rawProfile) {
        try {
            const profile = JSON.parse(rawProfile);
            googleId = Array.isArray(profile) ? profile[0] : undefined;
        } catch {
            googleId = undefined;
        }
    }
    if (!googleId) {
        res.status(401).json({ message: 'Not signed in' });
        return;
    }

    // Getting queue from Redis
    if (req.method == 'GET') {
        const queue_key = `${googleId}_queue`;
        const queue_list = await redis.lrange(queue_key, 0, -1);
        res.status(200).json({ queue_list });
    }
    // Posting to the agent lambda
    else if (req.method == 'PUT') {
        const userPrompt = req.body.data;
        try {
            const agentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/set-agent-queue/${googleId}/${userPrompt}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-google-id': googleId
                },
                body: JSON.stringify({ data: userPrompt }),
            });
            if (!agentRes.ok) {
                res.status(502).json({ message: 'Agent service error' });
                return;
            }
            res.status(200).json({ message: 'ok' });
        } catch (err) {
            console.error("Error messaging agent", err);
            res.status(502).json({ message: 'Error messaging agent' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
