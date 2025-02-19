/**
 * The root Domain on which all cookies should be set. (See:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_where_cookies_are_sent)
 *
 * In production, this should be set to "graduatenu.com" which allows
 * api.graduatenu.com to set cookies on every other *.graduatenu.com domain.
 */
export const COOKIE_DOMAIN =
  process.env.NODE_ENV === "production" ? "graduatenu.com" : "localhost";

export const UNDECIDED = "Undecided";
