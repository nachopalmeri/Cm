function getRedis() {
  const { Redis } = require('@upstash/redis')
  return Redis.fromEnv()
}

export async function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const redis = getRedis()
    const now = Math.floor(Date.now() / 1000)
    const windowStart = Math.floor(now / windowSeconds) * windowSeconds
    const redisKey = `rate_limit:${key}:${windowStart}`

    const current = (await redis.get(redisKey) as number) || 0
    if (current >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: (windowStart + windowSeconds) * 1000 }
    }

    await redis.incr(redisKey)
    await redis.expire(redisKey, windowSeconds)
    return { allowed: true, remaining: maxRequests - current - 1, resetAt: (windowStart + windowSeconds) * 1000 }
  } catch {
    return { allowed: true, remaining: 999, resetAt: Date.now() + 60000 }
  }
}