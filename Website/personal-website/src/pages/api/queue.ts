import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.status(405).json({ message: 'Method not allowed' });
        return;
    }

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

    const queue_key = `${googleId}_queue`;
    const queue_list = await redis.lrange(queue_key, 0, -1);
    res.status(200).json({ queue_list });
}
