// Edge-safe constants (no Node-only imports) shared between middleware and
// the server-only session helper.
export const SESSION_COOKIE_NAME = "nova_medtec_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
