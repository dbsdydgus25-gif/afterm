import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 개발 환경이나 환경변수가 없는 경우를 대비해 예외 처리를 포함한 Redis 클라이언트 초기화
const getRedisClient = () => {
    try {
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            return new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
        }
    } catch (e) {
        console.error("Upstash Redis initialization failed:", e);
    }
    return null;
};

const redis = getRedisClient();

// 공통 인스턴스: 없으면 dummy limiter(항상 통과)를 반환하도록 안전하게 매핑
export const getRateLimiter = (options: { requests: number, window: any }) => {
    if (!redis) {
        return {
            limit: async () => ({ success: true, pending: Promise.resolve(), limit: 10, remaining: 10, reset: 0 })
        };
    }
    return new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(options.requests, options.window),
        analytics: true,
    });
};

// AI 계열 고비용 API용 Rate Limiter: 1시간에 10번 호출 제한
export const aiRateLimiter = getRateLimiter({ requests: 10, window: "1 h" });
