export type DecodedToken = {
  sub: string;
  email: string;
  exp: number;
};

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as DecodedToken;
  } catch {
    return null;
  }
}
