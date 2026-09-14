// HTML5 `type="url"` validation only checks that a value parses as *a*
// URL — it does not restrict the scheme, so "javascript:alert(1)" passes.
// Since candidate.linkedin_url is stored as-is and later rendered as a
// real <a href>, anyone who can add a candidate could plant a script URL
// that runs in a coworker's (or admin's) browser when they click it.
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
