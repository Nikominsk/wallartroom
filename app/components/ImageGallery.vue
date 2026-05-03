<template>
  <section class="gallery">
    <header class="gallery__header">
      <h1>Image Gallery</h1>
      <p>Browse artworks by title, PIN, colors, and popularity.</p>
    </header>

    <div class="gallery__filters">
      <div class="gallery__filter-row">
        <input
          v-model="search"
          type="text"
          placeholder="Search title or #pinABCDE"
        />

        <select v-model="sortBy">
          <option value="popular">Most popular</option>
          <option value="leastPopular">Least popular</option>
          <option value="titleAsc">Title A-Z</option>
          <option value="titleDesc">Title Z-A</option>
        </select>

        <button @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? 'Hide' : 'Show' }} advanced filters
        </button>
      </div>

      <div v-if="showAdvanced" class="gallery__advanced">
        <select v-model="filters.mainColor">
          <option value="">Main color</option>
          <option v-for="color in availableColors" :key="color" :value="color">
            {{ color }}
          </option>
        </select>

        <select v-model="filters.secondaryColor">
          <option value="">Secondary color</option>
          <option v-for="color in availableColors" :key="color" :value="color">
            {{ color }}
          </option>
        </select>

        <select v-model="filters.thirdColor">
          <option value="">Third color</option>
          <option v-for="color in availableColors" :key="color" :value="color">
            {{ color }}
          </option>
        </select>
      </div>

      <button v-if="hasFilters" class="gallery__reset" @click="resetFilters">
        Reset filters
      </button>
    </div>

    <p class="gallery__count">
      Showing {{ filteredImages.length }} images
    </p>

    <p v-if="pending">Loading images...</p>

    <p v-else-if="error">
    {{ error }}
    </p>

    <div v-else class="gallery__grid">
      <article
        v-for="image in filteredImages"
        :key="image.pinId"
        class="gallery-card"
      >
        <div class="gallery-card__image">
          <img :src="image.src" :alt="image.title" />
        </div>

        <div class="gallery-card__body">
          <div class="gallery-card__top">
            <h2>{{ image.title }}</h2>
            <span>{{ image.pinId }}</span>
          </div>
          <div class="gallery-card__colors">
            <span
              v-for="color in image.colors"
              :key="color"
              class="gallery-card__color"
            >
              <span
                class="gallery-card__swatch"
                :style="{ backgroundColor: color }"
              />
            </span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
const search = ref('')
const sortBy = ref('newest')
const showAdvanced = ref(false)

const filters = reactive({
  mainColor: '',
  secondaryColor: '',
  thirdColor: ''
})

const { images, pending, error, loadImages } = useImages()

onMounted(() => {
  loadImages()
})

const availableColors = computed(() => {
  const colors = images.value.flatMap((image) => image.colors)
  return [...new Set(colors)].sort()
})

const hasFilters = computed(() => {
  return Boolean(
    search.value ||
    filters.mainColor ||
    filters.secondaryColor ||
    filters.thirdColor
  )
})

const filteredImages = computed(() => {
  const query = search.value.toLowerCase().trim()

  let result = images.value.filter((image) => {
    const matchesSearch =
      image.title.toLowerCase().includes(query) ||
      image.pinId.toLowerCase().includes(query)

    const matchesMain =
      !filters.mainColor || image.colors[0] === filters.mainColor

    const matchesSecondary =
      !filters.secondaryColor || image.colors[1] === filters.secondaryColor

    const matchesThird =
      !filters.thirdColor || image.colors[2] === filters.thirdColor

    return matchesSearch && matchesMain && matchesSecondary && matchesThird
  })

  return result
})

function resetFilters() {
  search.value = ''
  filters.mainColor = ''
  filters.secondaryColor = ''
  filters.thirdColor = ''
}
</script>

<style scoped lang="scss">
.gallery {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;

  &__header {
    margin-bottom: 32px;

    h1 {
      margin: 0 0 8px;
      font-size: 36px;
      line-height: 1.1;
    }

    p {
      margin: 0;
      color: #6b7280;
      font-size: 16px;
    }
  }

  &__filters {
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid #e5e7eb;
    border-radius: 24px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);

    input,
    select,
    button {
      width: 100%;
      min-height: 44px;
      padding: 0 14px;
      border: 1px solid #d1d5db;
      border-radius: 14px;
      background: #ffffff;
      font: inherit;
    }

    button {
      cursor: pointer;

      &:hover {
        background: #f9fafb;
      }
    }
  }

  &__filter-row,
  &__advanced {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  &__advanced {
    margin-top: 16px;
  }

  &__reset {
    margin-top: 14px;
    width: auto !important;
    border: none !important;
    color: #6b7280;
    background: transparent !important;

    &:hover {
      color: #111827;
    }
  }

  &__count {
    margin-bottom: 16px;
    color: #6b7280;
    font-size: 14px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
}

.gallery-card {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 35px rgba(15, 23, 42, 0.1);
  }

  &__image {
    aspect-ratio: 4 / 3;
    background: #f3f4f6;

    img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }
  }

  &__body {
    padding: 16px;
  }

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;

    h2 {
      margin: 0;
      font-size: 17px;
      line-height: 1.3;
    }

    span {
      flex-shrink: 0;
      color: #6b7280;
      font-size: 12px;
    }
  }

  &__popularity {
    margin: 8px 0 14px;
    color: #6b7280;
    font-size: 14px;
  }

  &__colors {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__color {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 9px;
    border-radius: 999px;
    background: #f3f4f6;
    font-size: 12px;
  }

  &__swatch {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.12);
  }
}

@media (max-width: 1024px) {
  .gallery {
    &__grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

@media (max-width: 768px) {
  .gallery {
    padding: 32px 16px;

    &__filter-row,
    &__advanced {
      grid-template-columns: 1fr;
    }

    &__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 520px) {
  .gallery {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>