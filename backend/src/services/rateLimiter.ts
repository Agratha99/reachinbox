import Redis from 'ioredis';

const DEFAULT_DELAY_MS = parseInt(process.env.DEFAULT_DELAY_MS || '50', 10);
const DEFAULT_MAX_HOURLY_LIMIT = parseInt(process.env.MAX_EMAILS_PER_HOUR || '1000', 10);

/**
 * Returns the current hour window string key, e.g. "2026-08-20T18"
 */
export function getHourWindowKey(date: Date = new Date()): string {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}`;
}

/**
 * Calculates the start Date of the next available hour window
 */
export function getNextHourWindowStart(date: Date = new Date()): Date {
    const nextHour = new Date(date.getTime());
    nextHour.setUTCHours(nextHour.getUTCHours() + 1, 0, 0, 0);
    return nextHour;
}

/**
 * Atomically checks and increments the hourly rate limit counter in Redis for a sender.
 * Key: email-rate:{senderId}:{hourWindow}
 */
export async function checkAndIncrementHourlyRate(
    redis: Redis,
    senderId: string,
    hourlyLimit: number = DEFAULT_MAX_HOURLY_LIMIT
): Promise<{ allowed: boolean; currentCount: number; limit: number; nextWindow: Date }> {
    const now = new Date();
    const hourKey = getHourWindowKey(now);
    const redisKey = `email-rate:${senderId}:${hourKey}`;

    // Atomic pipeline: increment and ensure 3700s TTL (slightly over 1 hour)
    const results = await redis
        .multi()
        .incr(redisKey)
        .ttl(redisKey)
        .exec();

    if (!results) {
        return { allowed: true, currentCount: 1, limit: hourlyLimit, nextWindow: getNextHourWindowStart(now) };
    }

    const currentCount = (results[0][1] as number) || 1;
    const ttl = (results[1][1] as number) || -1;

    if (ttl < 0) {
        await redis.expire(redisKey, 3700);
    }

    if (currentCount > hourlyLimit) {
        return {
            allowed: false,
            currentCount,
            limit: hourlyLimit,
            nextWindow: getNextHourWindowStart(now),
        };
    }

    return {
        allowed: true,
        currentCount,
        limit: hourlyLimit,
        nextWindow: getNextHourWindowStart(now),
    };
}

/**
 * Atomically reserves the next available send-slot timestamp for a sender enforcing DEFAULT_DELAY_MS
 */
export async function reserveSendSlot(
    redis: Redis,
    senderId: string,
    delayMs: number = DEFAULT_DELAY_MS
): Promise<number> {
    const slotKey = `email-send-slot:${senderId}`;
    const now = Date.now();

    const luaScript = `
    local currentSlot = tonumber(redis.call('get', KEYS[1]) or '0')
    local now = tonumber(ARGV[1])
    local delay = tonumber(ARGV[2])

    local nextSlot = math.max(now, currentSlot + delay)
    redis.call('set', KEYS[1], tostring(nextSlot), 'PX', 86400000)
    return nextSlot
  `;

    try {
        const reservedSlot = await redis.eval(luaScript, 1, slotKey, now.toString(), delayMs.toString());
        return Number(reservedSlot);
    } catch (err) {
        return now;
    }
}
