/**
 * Parse URLs from a given string.
 * Inspired by https://urlregex.com/
 *
 * @param rawText - A string that contains URLs
 * @param allowNoProtocol - Whether to allow URLs without protocol (e.g. www.google.com)
 * @param multiple - Whether to return all matched URLs
 * @returns If `multiple` is true, returns an array of [href, hostname]. Otherwise, returns the first match or null.
 */
export function urlParser(
  rawText: string,
  allowNoProtocol: boolean = false,
  multiple: boolean = false
): [string, string][] | [string, string] | null {
  const PERFECT_URL_REGEX =
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/g

  const urlCandidates: RegExpExecArray[] = []
  const urlSelected: [string, string][] = []

  let match: RegExpExecArray | null

  if (multiple || allowNoProtocol) {
    while ((match = PERFECT_URL_REGEX.exec(rawText)) !== null) {
      urlCandidates.push(match)
    }

    for (const match of urlCandidates) {
      if (allowNoProtocol) {
        const fullUrl = match[0]
        const hostname = match.length > 3 ? fullUrl.replace(match[3], '') : fullUrl
        urlSelected.push([fullUrl, hostname])
      } else {
        absoluteURLParse(match[0], urlSelected)
      }
    }
  } else {
    absoluteURLParse(rawText, urlSelected)
  }

  if (multiple) return urlSelected
  return urlSelected.length > 0 ? urlSelected[0] : null
}

function absoluteURLParse(rawText: string, selected: [string, string][]) {
  const ALLOWED_PROTOCOLS = ['http:', 'https:']
  try {
    const url = new URL(rawText)
    if (ALLOWED_PROTOCOLS.includes(url.protocol)) {
      selected.push([url.href, url.hostname])
    }
  } catch {
    // Invalid URL - silently ignored
  }
}
