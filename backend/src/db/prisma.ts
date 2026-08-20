import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/**
 * Execute a Prisma database query with automatic exponential backoff retry for transient DB locks or connection surges
 */
export async function withDbRetry<T>(
    queryFn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 100
): Promise<T> {
    let attempt = 0;
    while (true) {
        try {
            return await queryFn();
        } catch (error: any) {
            attempt++;
            if (attempt >= maxRetries) {
                console.error(`[DbRetry] Query failed after ${attempt} attempts:`, error?.message || error);
                throw error;
            }
            const delay = initialDelayMs * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}
