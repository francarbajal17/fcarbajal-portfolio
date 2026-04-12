import { getDb } from './db'

export interface Image {
  _id: string
  url: string
  title: string
  cat: 'landscape' | 'street' | 'portrait'
  loc: string
  section: 'hero' | 'portfolio'
  order: number
}

export interface SiteData {
  hero: Image[]
  portfolio: Image[]
  social: { instagram: string; linkedin: string; vsco: string }
}

const DEFAULT_SOCIAL = { instagram: '', linkedin: '', vsco: '' }

function serialize(doc: any): Image {
  return {
    _id: doc._id.toString(),
    url: doc.url,
    title: doc.title || '',
    cat: doc.cat || 'landscape',
    loc: doc.loc || '',
    section: doc.section,
    order: doc.order ?? 0,
  }
}

export async function getData(): Promise<SiteData> {
  const db = await getDb()

  const [images, settings] = await Promise.all([
    db.collection('images').find().sort({ order: 1 }).toArray(),
    db.collection('settings').findOne({ _id: 'main' as any }),
  ])

  return {
    hero: images.filter(i => i.section === 'hero').map(serialize),
    portfolio: images.filter(i => i.section === 'portfolio').map(serialize),
    social: settings?.social ?? DEFAULT_SOCIAL,
  }
}
