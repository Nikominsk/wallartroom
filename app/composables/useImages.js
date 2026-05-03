// composables/useImages.js

const DEMO_IMAGES = [
  {
    title: 'Boho Abstract Harmony',
    pinId: '#pinBOH01',
    src: 'https://picsum.photos/seed/art1/600/800',
    colors: ['#c5a059', '#8b4513', '#f5e6c8']
  },
  {
    title: 'Minimal Line Study',
    pinId: '#pinLIN02',
    src: 'https://picsum.photos/seed/art2/600/800',
    colors: ['#1a1a2e', '#e2c078', '#ffffff']
  },
  {
    title: 'Nordic Forest Scene',
    pinId: '#pinNOR03',
    src: 'https://picsum.photos/seed/art3/600/800',
    colors: ['#2d4a3e', '#a8c5a0', '#f0ebe3']
  },
  {
    title: 'Desert Dunes at Dusk',
    pinId: '#pinDES04',
    src: 'https://picsum.photos/seed/art4/600/800',
    colors: ['#d4895a', '#8b6347', '#fdf0e0']
  },
  {
    title: 'Geometric Bloom',
    pinId: '#pinGEO05',
    src: 'https://picsum.photos/seed/art5/600/800',
    colors: ['#e8a598', '#c47b6b', '#faf4f0']
  },
  {
    title: 'Ocean Whisper',
    pinId: '#pinOCE06',
    src: 'https://picsum.photos/seed/art6/600/800',
    colors: ['#4a90a4', '#2c6b7a', '#e8f4f8']
  },
  {
    title: 'Autumn Foliage Abstract',
    pinId: '#pinAUT07',
    src: 'https://picsum.photos/seed/art7/600/800',
    colors: ['#c0392b', '#e67e22', '#f9e4b7']
  },
  {
    title: 'Midnight Bloom',
    pinId: '#pinMID08',
    src: 'https://picsum.photos/seed/art8/600/800',
    colors: ['#2c3e50', '#8e44ad', '#d7bde2']
  },
]

export function useImages() {
  const images = ref([])
  const pending = ref(false)
  const error = ref(null)

  // const supabase = useSupabaseClient()

  async function loadImages() {
    pending.value = true
    error.value = null

    try {
      // Demo data — swap out for live Supabase query below
      await new Promise(r => setTimeout(r, 300)) // simulate network delay
      images.value = DEMO_IMAGES

      // const { data, supaError } = await supabase
      //   .from('image')
      //   .select(`
      //     title,
      //     pin_hashtag,
      //     public_url,
      //     primary_color,
      //     secondary_color,
      //     tertiary_color,
      //     created_date
      //   `)
      //   .eq('visibility', 'open')
      //   .order('created_date', { ascending: false })
      //
      // if (supaError) throw supaError
      //
      // images.value = (data || []).map((row) => ({
      //   title: row.title || 'Untitled',
      //   pinId: row.pin_hashtag?.startsWith('#')
      //     ? row.pin_hashtag
      //     : `#${row.pin_hashtag || ''}`,
      //   src: row.public_url || '',
      //   colors: [
      //     row.primary_color || '#999999',
      //     row.secondary_color || '#bbbbbb',
      //     row.tertiary_color || '#dddddd'
      //   ]
      // }))
    } catch (err) {
      error.value = err.message || 'Failed to load images'
    } finally {
      pending.value = false
    }
  }

  return {
    images,
    pending,
    error,
    loadImages
  }
}
