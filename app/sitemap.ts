import { MetadataRoute } from 'next'
import { SECTEURS, VILLES_UNIQUES, slugify } from '@/lib/seo-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://thelocalboost.fr'
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/analyser`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]

  const seoPages: MetadataRoute.Sitemap = []
  for (const secteurSlug of Object.keys(SECTEURS)) {
    for (const ville of VILLES_UNIQUES) {
      seoPages.push({
        url: `${base}/${secteurSlug}/${slugify(ville)}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  return [...staticPages, ...seoPages]
}
