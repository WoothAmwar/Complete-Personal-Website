import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import { fetchWithRetry } from '@/helperFunctions/fetchWithRetry';
import { entryFromStored, normalizeEntry } from '@/helperFunctions/queueEntry';

const redis = Redis.fromEnv();

/**
 * The queue is two keys that are kept in step:
 *
 *   `{googleId}_queue`      a list of video ids, in order, first is next up
 *   `{googleId}_queue_meta` a hash of videoId -> JSON {videoTitle, videoThumbnail}
 *
 * The list stays the ordered structure so lrange/lpos/lrem/lset all keep working
 * as they did - the Python agent in server/YoutubeData/youtube_queue.py drives
 * the same key with those commands. The hash carries everything needed to draw a
 * row, so the queue no longer depends on the video still existing in Mongo.
 */
const queueKeys = (googleId: string) => ({
    queue_key: `${googleId}_queue`,
    meta_key: `${googleId}_queue_meta`,
});

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
        const { queue_key, meta_key } = queueKeys(googleId);
        const [ids, meta] = await Promise.all([
            redis.lrange(queue_key, 0, -1),
            redis.hgetall<Record<string, unknown>>(meta_key),
        ]);
        const queue = ids.map((id) => entryFromStored(String(id), meta?.[String(id)]));
        res.status(200).json({ queue });
    }
    // Posting to the agent lambda
    else if (req.method == 'PUT') {
        const userPrompt = req.body.data;
        try {
            const agentRes = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/set-agent-queue`,
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
    }

    else if (req.method == 'POST') {
        const { queue_key, meta_key } = queueKeys(googleId);
        const entry = normalizeEntry(req.body?.data);
        if (!entry) {
            res.status(400).json({ message: 'Expected { data: { videoId, videoTitle, videoThumbnail } }' });
            return;
        }

        // The metadata is written even for a video already queued, so a re-add
        // refreshes a title or thumbnail that has since changed.
        const existingIndex = await redis.lpos(queue_key, entry.videoId);
        await redis.hset(meta_key, { [entry.videoId]: JSON.stringify(entry) });
        if (existingIndex === null) {
            await redis.rpush(queue_key, entry.videoId);
        }
        res.status(200).json({ ok: true });
    }

    else if (req.method == 'DELETE') {
        const { queue_key, meta_key } = queueKeys(googleId);
        const id_to_remove = req.body?.data;
        if (typeof id_to_remove !== 'string' || !id_to_remove) {
            res.status(400).json({ message: 'Expected { data: videoId }' });
            return;
        }
        // Count 0 removes every occurrence. The queue holds no duplicates, so
        // this leaves nothing behind that the hash field would still be needed for.
        await redis.lrem(queue_key, 0, id_to_remove);
        await redis.hdel(meta_key, id_to_remove);
        res.status(200).json({ ok: true });
    }

    else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
