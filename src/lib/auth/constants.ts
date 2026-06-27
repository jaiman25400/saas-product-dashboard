export const SESSION_COOKIE_NAME = "session";

/** 5 days — matches Firebase session cookie max recommended window */
export const SESSION_COOKIE_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

export const SESSION_COOKIE_MAX_AGE_SEC = SESSION_COOKIE_MAX_AGE_MS / 1000;
