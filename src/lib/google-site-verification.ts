/** Токен з Google Search Console (мета-тег verification), без префікса. */
export function getGoogleSiteVerificationToken(): string | undefined {
  const token = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  return token || undefined;
}
