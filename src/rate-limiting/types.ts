export interface RateLimitConfig {
  minuteLimit: number;
  minuteDuration: number;
  burstLimit: number;
  burstDuration: number;
  blockDuration?: number;
}

export interface RateLimitResponse {
  error: string;
  reason: string;
  retryInMs: number;
}

export interface RateLimitHeaders {
  'RateLimit-Limit-Minute': string;
  'RateLimit-Remaining-Minute': string;
  'RateLimit-Reset-Minute': string;
  'RateLimit-Limit-Burst': string;
  'RateLimit-Remaining-Burst': string;
  'RateLimit-Reset-Burst': string;
}
