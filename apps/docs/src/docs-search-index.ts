import { type DocsRoute, docsRoutes } from './docs-manifest'

export type DocsSearchResult = {
  matchedSection?: DocsRoute['toc'][number]
  route: DocsRoute
  score: number
}

function normalizeSearchText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim()
}

export function searchDocs(query: string): DocsSearchResult[] {
  const tokens = normalizeSearchText(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return []

  return docsRoutes
    .map((route): DocsSearchResult | null => {
      const title = normalizeSearchText(route.title)
      const description = normalizeSearchText(route.description)
      const headings = route.toc.map((item) => ({
        ...item,
        normalized: normalizeSearchText(item.label),
      }))
      const keywords = (route.keywords ?? []).map(normalizeSearchText)
      const searchable = [
        title,
        description,
        ...headings.map((item) => item.normalized),
        ...keywords,
      ]

      if (!tokens.every((token) => searchable.some((value) => value.includes(token)))) return null

      const matchedSection = headings.find((heading) =>
        tokens.some((token) => heading.normalized.includes(token)),
      )
      const score = tokens.reduce((total, token) => {
        if (title === token) return total + 12
        if (title.includes(token)) return total + 8
        if (headings.some((heading) => heading.normalized.includes(token))) return total + 6
        if (keywords.some((keyword) => keyword.includes(token))) return total + 4
        return total + 2
      }, 0)

      return matchedSection ? { matchedSection, route, score } : { route, score }
    })
    .filter((result): result is DocsSearchResult => result !== null)
    .sort(
      (left, right) =>
        right.score - left.score || left.route.title.localeCompare(right.route.title),
    )
}
