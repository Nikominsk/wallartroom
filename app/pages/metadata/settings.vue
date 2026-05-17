<template>
  <div class="settings-page">
    <header class="settings-page__header">
      <div>
        <h1 class="settings-page__title">Settings</h1>
        <p class="settings-page__subtitle">Boards and AI metadata defaults for this workspace.</p>
      </div>
    </header>

    <div class="settings-page__body">
      <nav class="settings-page__sections-nav" aria-label="Settings sections">
        <button
          v-for="s in sections"
          :key="s.id"
          type="button"
          class="settings-page__section-link"
          :class="{ 'settings-page__section-link--active': activeSection === s.id }"
          @click="activeSection = s.id"
        >
          <span class="settings-page__section-link-icon" v-html="s.icon" />
          <span>{{ s.label }}</span>
        </button>
      </nav>

      <div class="settings-page__content">
        <!-- ── Boards ────────────────────────────────────────────────────── -->
        <section v-show="activeSection === 'boards'" class="settings-card">
          <header class="settings-card__head">
            <div>
              <h2 class="settings-card__title">Boards</h2>
              <p class="settings-card__hint">Pick a color for each board, or leave it blank and we'll pick one automatically.</p>
            </div>
            <span class="settings-card__count">{{ boards.length }} board{{ boards.length === 1 ? '' : 's' }}</span>
          </header>

          <!-- Auto-import hint -->
          <div class="settings-card__board-tip">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13V3M6 7l4-4 4 4"/><path d="M3 13v3a1 1 0 001 1h12a1 1 0 001-1v-3"/>
            </svg>
            <div>
              You don't have to add boards by hand — <button type="button" class="settings-card__link-btn" @click="activeSection = 'pinterest-import'">import them automatically</button>
              from the CSV that Pinterest Business exports under <strong>Analytics → Overview → Export</strong>. It also pulls in each board's real impressions, saves and engagement so the AI can favour your proven boards.
            </div>
          </div>

          <!-- Pinterest board name warning -->
          <div class="settings-card__board-warning">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M10 1l9 17H1L10 1z"/><path d="M10 8v4M10 15h.01"/>
            </svg>
            <div>
              <strong>Board names must match your Pinterest account exactly.</strong>
              Pinterest CSV imports will fail if a board name doesn't already exist in your account. Use the exact same spelling, spaces, and capitalisation as shown in your Pinterest profile — including boards the AI may suggest.
            </div>
          </div>

          <div class="settings-card__body">
            <!-- New board row -->
            <form class="board-row board-row--new" @submit.prevent="handleAddBoard">
              <button
                type="button"
                class="board-row__swatch"
                :style="newSwatchStyle"
                :title="newColor ? newColor : 'Auto color'"
                aria-label="Choose color for new board"
                @click.stop="openPicker('new')"
              >
                <span v-if="!newColor" class="board-row__swatch-auto">A</span>
              </button>
              <input
                v-model.trim="newName"
                class="board-row__name-input"
                placeholder="New board name"
                maxlength="80"
              />
              <button type="submit" class="settings-btn settings-btn--primary" :disabled="!newName || addingBoard">
                {{ addingBoard ? 'Adding…' : 'Add board' }}
              </button>

              <!-- Color picker for the new-board row -->
              <div
                v-if="pickerOpenFor === 'new'"
                class="board-row__picker"
                @click.stop
              >
                <p class="board-row__picker-label">Pick a color</p>
                <div class="board-row__palette">
                  <button
                    v-for="hex in PALETTE"
                    :key="hex"
                    type="button"
                    class="board-row__palette-swatch"
                    :class="{ 'board-row__palette-swatch--active': newColor === hex }"
                    :style="{ background: hex }"
                    :aria-label="hex"
                    @click="setNewColor(hex)"
                  />
                  <button
                    type="button"
                    class="board-row__palette-swatch board-row__palette-swatch--clear"
                    :class="{ 'board-row__palette-swatch--active': !newColor }"
                    title="Auto color"
                    @click="setNewColor(null)"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12L12 2"/></svg>
                  </button>
                </div>

                <div class="board-row__hex">
                  <span class="board-row__hex-prefix">#</span>
                  <input
                    v-model="hexDraft"
                    class="board-row__hex-input"
                    type="text"
                    spellcheck="false"
                    maxlength="7"
                    placeholder="1d4ed8"
                    aria-label="Custom hex color"
                    @keydown.enter.prevent="applyHex"
                  />
                  <button type="button" class="board-row__hex-btn" :disabled="hexApplying" @click="applyHex">
                    <svg v-if="hexApplying" class="board-row__hex-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    <span v-else>Apply</span>
                  </button>
                </div>
                <p v-if="hexError" class="board-row__hex-error">{{ hexError }}</p>
              </div>
            </form>

            <p v-if="addError" class="settings-card__error">{{ addError }}</p>

            <!-- Existing boards -->
            <div v-if="boards.length" class="board-list">
              <div v-for="board in boards" :key="board.id" class="board-row">
                <button
                  type="button"
                  class="board-row__swatch"
                  :style="swatchStyleFor(board)"
                  :title="board.color || 'Auto color'"
                  :aria-label="`Change color for board ${board.name}`"
                  @click.stop="openPicker(board.id)"
                >
                  <span v-if="!board.color" class="board-row__swatch-auto">A</span>
                </button>

                <input
                  v-model.trim="editNames[board.id]"
                  class="board-row__name-input"
                  :placeholder="board.name"
                  @blur="commitName(board)"
                  @keydown.enter.prevent="$event.target.blur()"
                />

                <span v-if="rowError[board.id]" class="board-row__error" :title="rowError[board.id]">{{ rowError[board.id] }}</span>

                <button
                  class="settings-btn settings-btn--ghost-danger"
                  type="button"
                  :disabled="deletingId === board.id"
                  @click="handleDelete(board)"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l1 9a1 1 0 001 1h2a1 1 0 001-1l1-9" />
                  </svg>
                </button>

                <!-- Color picker popover (inline, anchored to this row) -->
                <div
                  v-if="pickerOpenFor === board.id"
                  class="board-row__picker"
                  @click.stop
                >
                  <p class="board-row__picker-label">Pick a color</p>
                  <div class="board-row__palette">
                    <button
                      v-for="hex in PALETTE"
                      :key="hex"
                      type="button"
                      class="board-row__palette-swatch"
                      :class="{ 'board-row__palette-swatch--active': board.color === hex }"
                      :style="{ background: hex }"
                      :aria-label="hex"
                      @click="setColor(board, hex)"
                    />
                    <button
                      type="button"
                      class="board-row__palette-swatch board-row__palette-swatch--clear"
                      :class="{ 'board-row__palette-swatch--active': !board.color }"
                      title="Auto color"
                      @click="setColor(board, null)"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12L12 2"/></svg>
                    </button>
                  </div>

                  <div class="board-row__hex">
                    <span class="board-row__hex-prefix">#</span>
                    <input
                      v-model="hexDraft"
                      class="board-row__hex-input"
                      type="text"
                      spellcheck="false"
                      maxlength="7"
                      placeholder="1d4ed8"
                      aria-label="Custom hex color"
                      @keydown.enter.prevent="applyHex"
                    />
                    <button type="button" class="board-row__hex-btn" :disabled="hexApplying" @click="applyHex">
                    <svg v-if="hexApplying" class="board-row__hex-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    <span v-else>Apply</span>
                  </button>
                  </div>
                  <p v-if="hexError" class="board-row__hex-error">{{ hexError }}</p>
                </div>
              </div>
            </div>

            <div v-else-if="!boardsLoading" class="settings-card__empty">
              No boards yet. Add your first board above.
            </div>
          </div>
        </section>

        <!-- ── AI defaults ──────────────────────────────────────────────── -->
        <section v-show="activeSection === 'ai'" class="settings-card">
          <header class="settings-card__head">
            <div>
              <h2 class="settings-card__title">AI Metadata Generation defaults</h2>
              <p class="settings-card__hint">These values pre-fill the AI generation modal. You can still override them per run.</p>
            </div>
          </header>

          <form class="settings-card__body settings-card__body--form" @submit.prevent="handleSaveAi">
            <div class="settings-grid">
              <div class="settings-field">
                <label class="settings-field__label">Maximum title length</label>
                <input
                  v-model.number="aiDraft.ai_max_title_length"
                  type="number"
                  class="settings-field__input"
                  min="10"
                  max="255"
                />
                <span class="settings-field__hint">Pinterest hard limit: 100 characters.</span>
              </div>

              <div class="settings-field">
                <label class="settings-field__label">Maximum description length</label>
                <input
                  v-model.number="aiDraft.ai_max_description_length"
                  type="number"
                  class="settings-field__input"
                  min="10"
                  max="800"
                />
                <span class="settings-field__hint">Pinterest hard limit: 500 characters.</span>
              </div>

              <div class="settings-field">
                <label class="settings-field__label">Default tone / style</label>
                <input
                  v-model="aiDraft.ai_default_tone"
                  class="settings-field__input"
                  placeholder="e.g. inspiring, minimal, playful"
                />
              </div>

              <div class="settings-field">
                <label class="settings-field__label">Default language</label>
                <select v-model="aiDraft.ai_default_language" class="settings-field__input">
                  <option>English</option>
                  <option>German</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>Italian</option>
                  <option>Dutch</option>
                </select>
              </div>
            </div>

            <div class="settings-field settings-field--full">
              <label class="settings-field__label">Additional instructions</label>
              <textarea
                v-model="aiDraft.ai_additional_instructions"
                class="settings-field__input settings-field__input--textarea"
                rows="4"
                placeholder="e.g. Do not use characters like '-' when generating titles and descriptions."
              />
              <span class="settings-field__hint">Free-form guidance appended to every AI generation request.</span>
            </div>

            <div class="settings-card__footer">
              <button type="submit" class="settings-btn settings-btn--primary" :disabled="!aiDirty || savingAi">
                {{ savingAi ? 'Saving…' : 'Save changes' }}
              </button>
              <button type="button" class="settings-btn" :disabled="!aiDirty || savingAi" @click="resetAiDraft">
                Discard
              </button>
              <span v-if="aiSaved" class="settings-card__status settings-card__status--ok">Saved</span>
              <span v-if="aiError" class="settings-card__status settings-card__status--err">{{ aiError }}</span>
            </div>
          </form>
        </section>

          <!-- ── CSV Export ───────────────────────────────────────────────── -->
          <section v-show="activeSection === 'export'" class="settings-card">
            <header class="settings-card__head">
              <div>
                <h2 class="settings-card__title">CSV export timezone</h2>
                <p class="settings-card__hint">
                  Pinterest reads the publish time in the CSV using your Pinterest
                  account's timezone. Set this to the same zone so a pin scheduled
                  for 3:00 PM is actually posted at 3:00 PM.
                </p>
              </div>
            </header>

            <form class="settings-card__body settings-card__body--form" @submit.prevent="handleSaveAi">
              <div class="settings-field settings-field--full">
                <label class="settings-field__label" for="csv-tz">Timezone</label>
                <select id="csv-tz" v-model="aiDraft.csv_timezone" class="settings-field__input">
                  <option v-for="tz in METADATA_TIMEZONES" :key="tz.value" :value="tz.value">
                    {{ tz.label }}
                  </option>
                </select>
                <span class="settings-field__hint">
                  Current offset: <strong>{{ tzOffset || '—' }}</strong>.
                  Times entered elsewhere in the tool are written to the CSV in this zone.
                </span>
              </div>

              <div class="settings-card__footer">
                <button type="submit" class="settings-btn settings-btn--primary" :disabled="!aiDirty || savingAi">
                  {{ savingAi ? 'Saving…' : 'Save changes' }}
                </button>
                <button type="button" class="settings-btn" :disabled="!aiDirty || savingAi" @click="resetAiDraft">
                  Discard
                </button>
                <span v-if="aiSaved" class="settings-card__status settings-card__status--ok">Saved</span>
                <span v-if="aiError" class="settings-card__status settings-card__status--err">{{ aiError }}</span>
              </div>
            </form>
          </section>
        <!-- ── AI Templates ─────────────────────────────────────────────── -->
        <section v-show="activeSection === 'templates'" class="settings-card">
          <header class="settings-card__head">
            <div>
              <h2 class="settings-card__title">AI Generation Templates</h2>
              <p class="settings-card__hint">Saved option sets you can load instantly in the AI generation modal.</p>
            </div>
          </header>

          <div class="settings-card__body">

            <!-- Template list -->
            <div v-if="tplLoading" class="settings-card__empty">Loading…</div>
            <div v-else-if="!templates.length && !showNewTplForm" class="settings-card__empty">
              No templates yet. Create one below.
            </div>

            <div v-else class="tpl-list">
              <div v-for="tpl in templates" :key="tpl.id" class="tpl-row">
                <!-- Header row: name + actions -->
                <div class="tpl-row__head">
                  <input
                    v-model="tplEditNames[tpl.id]"
                    class="tpl-row__name-input"
                    :placeholder="tpl.name"
                    @blur="commitTplName(tpl)"
                    @keydown.enter.prevent="$event.target.blur()"
                  />
                  <button
                    class="tpl-row__expand"
                    type="button"
                    :title="tplExpanded[tpl.id] ? 'Collapse' : 'Edit options'"
                    @click="tplExpanded[tpl.id] = !tplExpanded[tpl.id]"
                  >
                    <svg
                      width="12" height="12" viewBox="0 0 12 12" fill="none"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                      :style="{ transform: tplExpanded[tpl.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }"
                    ><path d="M2 4l4 4 4-4"/></svg>
                  </button>
                  <button
                    class="settings-btn settings-btn--ghost-danger"
                    type="button"
                    :disabled="tplDeleting === tpl.id"
                    @click="deleteTpl(tpl.id)"
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l1 9a1 1 0 001 1h2a1 1 0 001-1l1-9" />
                    </svg>
                  </button>
                </div>
                <p v-if="tplRowError[tpl.id]" class="tpl-row__err">{{ tplRowError[tpl.id] }}</p>

                <!-- Expandable options form -->
                <div v-if="tplExpanded[tpl.id]" class="tpl-row__form">
                  <div class="tpl-form-grid">
                    <div class="tpl-form-field">
                      <label class="tpl-form-field__label">Niche / topic</label>
                      <input v-model="tplDrafts[tpl.id].niche" class="tpl-form-field__input" placeholder="e.g. boho living room" />
                    </div>
                    <div class="tpl-form-field">
                      <label class="tpl-form-field__label">Tone / style</label>
                      <input v-model="tplDrafts[tpl.id].tone" class="tpl-form-field__input" placeholder="e.g. inspiring" />
                    </div>
                    <div class="tpl-form-field">
                      <label class="tpl-form-field__label">Language</label>
                      <select v-model="tplDrafts[tpl.id].language" class="tpl-form-field__input">
                        <option>English</option><option>German</option><option>French</option>
                        <option>Spanish</option><option>Italian</option><option>Dutch</option>
                      </select>
                    </div>
                    <div class="tpl-form-field">
                      <label class="tpl-form-field__label">Target audience</label>
                      <input v-model="tplDrafts[tpl.id].targetAudience" class="tpl-form-field__input" placeholder="e.g. home decorators" />
                    </div>
                    <div class="tpl-form-field tpl-form-field--full">
                      <label class="tpl-form-field__label">Additional context</label>
                      <textarea v-model="tplDrafts[tpl.id].additionalContext" class="tpl-form-field__input tpl-form-field__input--textarea" rows="2" placeholder="e.g. Digital print shop selling boho-style wall art." />
                    </div>
                    <div class="tpl-form-field">
                      <label class="tpl-form-field__label">Include keywords</label>
                      <input v-model="tplDrafts[tpl.id].includeKeywords" class="tpl-form-field__input" placeholder="keyword1, keyword2" />
                    </div>
                    <div class="tpl-form-field">
                      <label class="tpl-form-field__label">Exclude keywords</label>
                      <input v-model="tplDrafts[tpl.id].excludeKeywords" class="tpl-form-field__input" placeholder="word1, word2" />
                    </div>
                  </div>
                  <div class="tpl-row__form-foot">
                    <button class="settings-btn settings-btn--primary" type="button" :disabled="tplSaving[tpl.id]" @click="saveTplOptions(tpl)">
                      {{ tplSaving[tpl.id] ? 'Saving…' : 'Save options' }}
                    </button>
                    <button class="settings-btn" type="button" @click="resetTplDraft(tpl)">Discard</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- New template form -->
            <div v-if="showNewTplForm" class="tpl-new-form">
              <div class="tpl-form-grid">
                <div class="tpl-form-field">
                  <label class="tpl-form-field__label">Template name <span style="color:#ef4444">*</span></label>
                  <input ref="newTplNameInput" v-model="newTpl.name" class="tpl-form-field__input" placeholder="e.g. Boho wall art" maxlength="100" />
                </div>
                <div class="tpl-form-field">
                  <label class="tpl-form-field__label">Niche / topic</label>
                  <input v-model="newTpl.options.niche" class="tpl-form-field__input" placeholder="e.g. boho living room" />
                </div>
                <div class="tpl-form-field">
                  <label class="tpl-form-field__label">Tone / style</label>
                  <input v-model="newTpl.options.tone" class="tpl-form-field__input" placeholder="e.g. inspiring" />
                </div>
                <div class="tpl-form-field">
                  <label class="tpl-form-field__label">Language</label>
                  <select v-model="newTpl.options.language" class="tpl-form-field__input">
                    <option>English</option><option>German</option><option>French</option>
                    <option>Spanish</option><option>Italian</option><option>Dutch</option>
                  </select>
                </div>
                <div class="tpl-form-field">
                  <label class="tpl-form-field__label">Target audience</label>
                  <input v-model="newTpl.options.targetAudience" class="tpl-form-field__input" placeholder="e.g. home decorators" />
                </div>
                <div class="tpl-form-field tpl-form-field--full">
                  <label class="tpl-form-field__label">Additional context</label>
                  <textarea v-model="newTpl.options.additionalContext" class="tpl-form-field__input tpl-form-field__input--textarea" rows="2" placeholder="e.g. Digital print shop selling boho-style wall art." />
                </div>
                <div class="tpl-form-field">
                  <label class="tpl-form-field__label">Include keywords</label>
                  <input v-model="newTpl.options.includeKeywords" class="tpl-form-field__input" placeholder="keyword1, keyword2" />
                </div>
                <div class="tpl-form-field">
                  <label class="tpl-form-field__label">Exclude keywords</label>
                  <input v-model="newTpl.options.excludeKeywords" class="tpl-form-field__input" placeholder="word1, word2" />
                </div>
              </div>
              <div class="tpl-row__form-foot">
                <button class="settings-btn settings-btn--primary" type="button" :disabled="!newTpl.name.trim() || newTplSaving" @click="createNewTpl">
                  {{ newTplSaving ? 'Creating…' : 'Create template' }}
                </button>
                <button class="settings-btn" type="button" @click="showNewTplForm = false; resetNewTpl()">Cancel</button>
                <span v-if="newTplError" class="settings-card__status settings-card__status--err">{{ newTplError }}</span>
              </div>
            </div>

            <div class="settings-card__footer" style="border-top: none; padding-top: 0;">
              <button v-if="!showNewTplForm" class="settings-btn settings-btn--primary" type="button" @click="openNewTplForm">
                + New template
              </button>
            </div>
          </div>
        </section>

        <!-- ── Pinterest Import ─────────────────────────────────────────────── -->
        <section v-show="activeSection === 'pinterest-import'" class="settings-card">
          <header class="settings-card__head">
            <div>
              <h2 class="settings-card__title">Pinterest Analytics Import</h2>
              <p class="settings-card__hint">Import your Pinterest analytics CSV to automatically populate board names and other data for new projects.</p>
            </div>
          </header>

          <div class="settings-card__body settings-card__body--form">

            <!-- Info callout -->
            <div class="csv-import__info">
              <div class="csv-import__info-icon">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 7h.01"/>
                </svg>
              </div>
              <div class="csv-import__info-body">
                <strong class="csv-import__info-title">What is this CSV?</strong>
                <p class="csv-import__info-text">
                  Pinterest Business accounts can export analytics data as a CSV file. This file contains your board names, pin counts, and engagement stats — exactly what we need to pre-fill board lists in new projects.
                </p>
                <ol class="csv-import__info-steps">
                  <li>Go to <strong>Pinterest Business Hub → Analytics → Overview</strong></li>
                  <li>Set the date range you want (last 30 days is usually enough)</li>
                  <li>Click <strong>Export</strong> (top-right corner) → <strong>Download .csv</strong></li>
                  <li>Drag the downloaded file into the upload zone below</li>
                </ol>
                <p class="csv-import__info-note">
                  Only <code>.csv</code> files exported from Pinterest Analytics are supported. The file is processed locally — nothing is uploaded to external servers.
                </p>
              </div>
            </div>

            <!-- Hidden native file input (driven by the dropzone) -->
            <input
              ref="csvFileInput"
              type="file"
              accept=".csv,text/csv,text/plain"
              class="csv-import__file-input"
              @change="onFilePicked"
            />

            <!-- Drop zone (hidden once we have content) -->
            <div
              v-if="!csvText"
              class="csv-import__dropzone"
              :class="{ 'csv-import__dropzone--drag': dragOver }"
              role="button"
              tabindex="0"
              aria-label="Upload Pinterest analytics CSV"
              @click="csvFileInput?.click()"
              @keydown.enter.prevent="csvFileInput?.click()"
              @keydown.space.prevent="csvFileInput?.click()"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="onDrop"
            >
              <div class="csv-import__dropzone-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 15V3M8 7l4-4 4 4"/>
                  <path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2"/>
                </svg>
              </div>
              <p class="csv-import__dropzone-headline">Drag &amp; drop your CSV here</p>
              <p class="csv-import__dropzone-sub">or <span class="csv-import__dropzone-browse">browse files</span></p>
              <p class="csv-import__dropzone-constraint">Accepts <code>.csv</code> files only · Max 5 MB</p>
              <button type="button" class="csv-import__paste-toggle" @click.stop="pasteMode = !pasteMode">
                {{ pasteMode ? 'Hide text box' : 'or paste the CSV text instead' }}
              </button>
            </div>

            <!-- Paste-as-text fallback -->
            <div v-if="!csvText && pasteMode" class="settings-field settings-field--full">
              <label class="settings-field__label">Paste Pinterest analytics CSV</label>
              <textarea
                v-model="pasteBuffer"
                class="settings-field__input settings-field__input--textarea"
                rows="6"
                placeholder="Analytics overview&#10;2026-04-16 - 2026-05-16&#10;…"
              />
              <button
                type="button"
                class="settings-btn settings-btn--primary"
                style="align-self:flex-start;margin-top:8px"
                :disabled="pasteBuffer.trim().length < 20"
                @click="usePastedText"
              >
                Use this text
              </button>
            </div>

            <!-- File feedback -->
            <div
              v-if="csvText"
              class="csv-import__feedback"
              :class="analyzeError ? 'csv-import__feedback--error' : 'csv-import__feedback--success'"
            >
              <div
                class="csv-import__feedback-icon"
                :class="analyzeError ? 'csv-import__feedback-icon--error' : 'csv-import__feedback-icon--success'"
              >
                <svg v-if="!analyzeError" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l3.5 3.5L13 4.5"/></svg>
                <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l8 8M10 2L2 10"/></svg>
              </div>
              <div class="csv-import__feedback-body">
                <span class="csv-import__feedback-name">{{ fileName || 'Pasted CSV text' }}</span>
                <span class="csv-import__feedback-size">
                  {{ sizeLabel }}<template v-if="analyzing"> · Analyzing…</template><template v-else-if="analyzeError"> · {{ analyzeError }}</template><template v-else-if="analysis"> · Valid Pinterest export</template>
                </span>
              </div>
              <button class="csv-import__feedback-remove" type="button" aria-label="Remove file" @click="resetImport">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 2l8 8M10 2L2 10"/></svg>
              </button>
            </div>

            <!-- Parsed preview -->
            <div v-if="analysis" class="csv-import__preview">
              <div class="csv-import__preview-head">
                <span class="csv-import__preview-label">Boards detected</span>
                <span class="csv-import__preview-badge">{{ analysis.boards.detected }} boards</span>
              </div>

              <div class="csv-import__summary">
                <span v-if="analysis.handle"><strong>@{{ analysis.handle }}</strong></span>
                <span v-if="analysis.period?.start">{{ analysis.period.start }} → {{ analysis.period.end }}</span>
                <span v-if="analysis.boards.willCreate?.length">{{ analysis.boards.willCreate.length }} new</span>
                <span v-if="analysis.boards.willUpdate?.length">{{ analysis.boards.willUpdate.length }} updated</span>
                <span v-if="analysis.boards.systemSkipped">{{ analysis.boards.systemSkipped }} system skipped</span>
              </div>

              <ul class="csv-import__board-list">
                <li
                  v-for="name in (analysis.boards.allNames || []).slice(0, showAllBoards ? 999 : 6)"
                  :key="name"
                  class="csv-import__board-item"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 7h12"/></svg>
                  {{ name }}
                  <span v-if="analysis.boards.willCreate?.includes(name)" class="csv-import__board-tag">new</span>
                </li>
                <li
                  v-if="!showAllBoards && (analysis.boards.allNames || []).length > 6"
                  class="csv-import__board-item csv-import__board-item--more"
                  @click="showAllBoards = true"
                >
                  +{{ analysis.boards.allNames.length - 6 }} more boards — show all
                </li>
              </ul>

              <p v-if="analysis.topThemes?.length" class="csv-import__preview-note">
                <strong>AI signal:</strong> strongest themes by real impressions —
                {{ analysis.topThemes.join(', ') }}. These (plus each board's
                impressions / saves) are saved so the AI favours your proven boards.
              </p>
              <p class="csv-import__preview-note">
                Board names are derived from your Pinterest board URLs. Confirm they
                match your account exactly — see the warning in the <strong>Boards</strong> section.
              </p>
            </div>

            <!-- Success result -->
            <div v-if="importResult" class="csv-import__feedback csv-import__feedback--success">
              <div class="csv-import__feedback-icon csv-import__feedback-icon--success">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l3.5 3.5L13 4.5"/></svg>
              </div>
              <div class="csv-import__feedback-body">
                <span class="csv-import__feedback-name">Import complete</span>
                <span class="csv-import__feedback-size">
                  {{ importResult.boards.created }} created · {{ importResult.boards.updated }} updated · performance saved for AI
                </span>
              </div>
            </div>

            <!-- Options + Action footer -->
            <label v-if="analysis && !importResult" class="csv-import__opt">
              <input type="checkbox" v-model="includeSystem" @change="analyze" />
              Include Pinterest system boards (e.g. “Quick creates”)
            </label>

            <div class="settings-card__footer">
              <button
                v-if="!importResult"
                type="button"
                class="settings-btn settings-btn--primary"
                :disabled="!analysis || analyzing || importing"
                @click="runImport"
              >
                {{ importing ? 'Importing…' : 'Import boards' }}
              </button>
              <button type="button" class="settings-btn" :disabled="importing" @click="resetImport">
                {{ importResult ? 'Import another' : 'Clear' }}
              </button>
              <span v-if="importError" class="settings-card__status settings-card__status--err">{{ importError }}</span>
            </div>

          </div>
        </section>

        <!-- ── Project ───────────────────────────────────────────────────── -->
        <section v-show="activeSection === 'project'" class="settings-card">
          <header class="settings-card__head">
            <div>
              <h2 class="settings-card__title">Project</h2>
              <p class="settings-card__hint">Rename the project you're currently working in. The new name applies everywhere, including the sidebar switcher.</p>
            </div>
          </header>

          <div class="settings-card__body">
            <div class="settings-field settings-field--full">
              <label class="settings-field__label" for="project-name">Project name</label>
              <div class="project-rename">
                <input
                  id="project-name"
                  v-model.trim="projectNameDraft"
                  class="settings-field__input"
                  type="text"
                  maxlength="120"
                  spellcheck="false"
                  placeholder="Project name"
                  :disabled="projectSaving || !activeProject"
                  @keydown.enter.prevent="handleRenameProject"
                />
                <button
                  type="button"
                  class="settings-btn settings-btn--primary"
                  :disabled="!canSaveProjectName"
                  @click="handleRenameProject"
                >
                  {{ projectSaving ? 'Saving…' : 'Save' }}
                </button>
              </div>
              <p v-if="projectRenameError" class="settings-card__error">{{ projectRenameError }}</p>
              <span v-else-if="projectRenameSaved" class="settings-field__hint">Saved.</span>
            </div>

            <!-- Delete project (danger zone, consequences spelled out) -->
            <div class="danger-zone" style="margin-top:28px">
              <div class="danger-zone__head">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 2L1 18h18L10 2z"/><path d="M10 8v4M10 15h.01"/>
                </svg>
                <div>
                  <h3 class="danger-zone__title">Delete this project</h3>
                  <p class="danger-zone__text">
                    Permanently deletes
                    <strong>{{ activeProject?.name || 'this project' }}</strong>
                    and <strong>everything inside it</strong>: all uploaded images
                    (including the actual files in storage), every pin, draft,
                    schedule and posted item, all boards, the entire CSV-export
                    history, AI templates and this project's settings.
                    <strong>This cannot be undone.</strong>
                    Your account and any other projects are not affected.
                  </p>
                </div>
              </div>

              <div v-if="onlyOneProject" class="danger-zone__locked">
                You can't delete your only project. Create another project from the
                sidebar switcher first.
              </div>

              <div v-else class="danger-zone__confirm">
                <label class="danger-zone__label" for="project-delete-confirm">
                  Type the project name
                  <strong>{{ activeProject?.name }}</strong> to confirm
                </label>
                <input
                  id="project-delete-confirm"
                  v-model="projectDeleteConfirm"
                  class="settings-field__input"
                  type="text"
                  autocomplete="off"
                  spellcheck="false"
                  :placeholder="activeProject?.name"
                  :disabled="projectDeleting"
                />
                <button
                  type="button"
                  class="settings-btn settings-btn--danger"
                  :disabled="!canDeleteProject"
                  @click="handleDeleteProject"
                >
                  <svg v-if="projectDeleting" class="danger-zone__spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  <span>{{ projectDeleting ? 'Deleting…' : 'Delete project' }}</span>
                </button>
                <p v-if="projectDeleteError" class="settings-card__error">{{ projectDeleteError }}</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'metadata' })

// ── State ─────────────────────────────────────────────────────────────────────
// Pickable swatches. The FIRST 8 must stay in sync with FALLBACK_PALETTE in
// usePinterestBoards.js and FALLBACK_COLORS in dashboard.vue (that subset is
// the auto-color set used when a board has no explicit color). The rest are
// extra options — boards store an explicit hex so they don't need a fallback.
const PALETTE = [
  '#ff6b35',
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#0ea5e9',
  '#a855f7',
  '#d946ef',
  '#64748b',
]

const sections = [
  {
    id: 'boards',
    label: 'Boards',
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 7h12"/></svg>`,
  },
  {
    id: 'ai',
    label: 'AI Defaults',
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5l1.6 3.4 3.4 1.6-3.4 1.6L8 11.5 6.4 8.1 3 6.5l3.4-1.6z"/><path d="M12 11.5l.7 1.4 1.3.6-1.3.6-.7 1.4-.7-1.4-1.3-.6 1.3-.6z"/></svg>`,
  },
  {
    id: 'export',
    label: 'CSV Export',
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1v9M5 7l3 3 3-3"/><path d="M2 11v3a1 1 0 001 1h10a1 1 0 001-1v-3"/></svg>`,
  },
  {
    id: 'templates',
    label: 'AI Templates',
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="5" rx="1.5"/><rect x="2" y="9" width="5" height="5" rx="1.5"/><rect x="9" y="9" width="5" height="5" rx="1.5"/></svg>`,
  },
  {
    id: 'pinterest-import',
    label: 'Pinterest Import',
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11V3M5 6l3-3 3 3"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2"/></svg>`,
  },
  {
    id: 'project',
    label: 'Project',
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5A1.5 1.5 0 013.5 4h3l1.5 1.5h4.5A1.5 1.5 0 0114 7v4.5A1.5 1.5 0 0112.5 13h-9A1.5 1.5 0 012 11.5z"/></svg>`,
  },
]

const activeSection = ref('boards')

// ── Boards ────────────────────────────────────────────────────────────────────
const {
  boards,
  loading: boardsLoading,
  loadBoards,
  addBoard,
  updateBoard,
  deleteBoard,
  chipStyleForName,
} = usePinterestBoards()

// Reloaded after an analytics import so the AI account brief stays in sync.
const { load: loadProjectMeta } = useMetadataProject()

const newName = ref('')
const newColor = ref(null)
const addingBoard = ref(false)
const addError = ref('')
const deletingId = ref(null)

// Per-row editable name + per-row inline error
const editNames = reactive({})
const rowError = reactive({})

// Which row has its color picker open ('new', a board id, or null)
const pickerOpenFor = ref(null)

// Custom hex entry shared by whichever picker is open (only one at a time).
const hexDraft = ref('')
const hexError = ref('')
const hexApplying = ref(false)

function normalizeHex(v) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(v ?? '').trim())
  return m ? `#${m[1].toLowerCase()}` : null
}

async function applyHex() {
  const hex = normalizeHex(hexDraft.value)
  if (!hex) {
    hexError.value = 'Enter a 6-digit hex color, e.g. 1d4ed8'
    return
  }
  hexError.value = ''

  if (pickerOpenFor.value === 'new') {
    setNewColor(hex)
    hexDraft.value = ''
    return
  }

  const board = boards.value.find(b => b.id === pickerOpenFor.value)
  if (!board) return

  hexApplying.value = true
  rowError[board.id] = ''
  try {
    await updateBoard(board.id, { color: hex })
    pickerOpenFor.value = null
    hexDraft.value = ''
  } catch (e) {
    hexError.value = e?.data?.statusMessage ?? 'Could not save color'
  } finally {
    hexApplying.value = false
  }
}

watch(boards, (list) => {
  for (const b of list) {
    if (editNames[b.id] === undefined) editNames[b.id] = b.name
  }
}, { deep: false, immediate: true })

const newSwatchStyle = computed(() => {
  if (newColor.value) return { background: newColor.value }
  return { background: '#f3f4f6', color: '#9ca3af' }
})

function swatchStyleFor(board) {
  if (board.color) return { background: board.color }
  const style = chipStyleForName(board.name)
  return style ? { background: style.background } : { background: '#f3f4f6' }
}

function openPicker(id) {
  pickerOpenFor.value = pickerOpenFor.value === id ? null : id
  hexDraft.value = ''
  hexError.value = ''
}

function setNewColor(hex) {
  newColor.value = hex
  pickerOpenFor.value = null
}

async function setColor(board, color) {
  pickerOpenFor.value = null
  rowError[board.id] = ''
  try {
    await updateBoard(board.id, { color })
  } catch (e) {
    rowError[board.id] = e?.data?.statusMessage ?? 'Could not save color'
  }
}

async function commitName(board) {
  const next = (editNames[board.id] ?? '').trim()
  if (!next || next === board.name) {
    editNames[board.id] = board.name
    return
  }
  rowError[board.id] = ''
  try {
    await updateBoard(board.id, { name: next })
  } catch (e) {
    rowError[board.id] = e?.data?.statusMessage ?? 'Could not rename board'
    editNames[board.id] = board.name
  }
}

async function handleAddBoard() {
  addError.value = ''
  if (!newName.value) return
  addingBoard.value = true
  try {
    await addBoard(newName.value, newColor.value)
    newName.value = ''
    newColor.value = null
  } catch (e) {
    addError.value = e?.data?.statusMessage ?? e?.message ?? 'Could not add board'
  } finally {
    addingBoard.value = false
  }
}

async function handleDelete(board) {
  if (!confirm(`Delete board "${board.name}"? This can't be undone.`)) return
  deletingId.value = board.id
  rowError[board.id] = ''
  try {
    await deleteBoard(board.id)
    delete editNames[board.id]
    delete rowError[board.id]
  } catch (e) {
    rowError[board.id] = e?.data?.statusMessage ?? 'Could not delete board'
  } finally {
    deletingId.value = null
  }
}

// ── AI defaults ───────────────────────────────────────────────────────────────
const { settings: aiSettings, load: loadSettings, save: saveSettings } = useMetadataSettings()

const aiDraft = reactive({ ...aiSettings.value })
const savingAi = ref(false)
const aiSaved = ref(false)
const aiError = ref('')

// Live offset for the currently selected CSV export timezone.
const tzOffset = computed(() => zoneOffsetLabel(aiDraft.csv_timezone))

const aiDirty = computed(() => {
  for (const key of Object.keys(aiSettings.value)) {
    if (aiDraft[key] !== aiSettings.value[key]) return true
  }
  return false
})

function syncDraftFromSettings() {
  for (const key of Object.keys(aiSettings.value)) {
    aiDraft[key] = aiSettings.value[key]
  }
}

watch(aiSettings, () => syncDraftFromSettings(), { deep: true })

function resetAiDraft() {
  syncDraftFromSettings()
  aiError.value = ''
}

async function handleSaveAi() {
  savingAi.value = true
  aiError.value = ''
  aiSaved.value = false
  try {
    await saveSettings({ ...aiDraft })
    aiSaved.value = true
    setTimeout(() => { aiSaved.value = false }, 2500)
  } catch (e) {
    aiError.value = e?.data?.statusMessage ?? e?.message ?? 'Could not save settings'
  } finally {
    savingAi.value = false
  }
}

// ── AI Templates ──────────────────────────────────────────────────────────────
const { templates, loading: tplLoading, load: loadTemplates, create: createTemplate, update: updateTemplate, remove: removeTemplate } = useAiTemplates()

// Per-template: editable names, expanded state, draft options, saving/error flags
const tplEditNames = reactive({})
const tplExpanded  = reactive({})
const tplDrafts    = reactive({})
const tplSaving    = reactive({})
const tplRowError  = reactive({})
const tplDeleting  = ref(null)

watch(templates, (list) => {
  for (const t of list) {
    if (tplEditNames[t.id] === undefined) tplEditNames[t.id] = t.name
    if (!tplDrafts[t.id]) tplDrafts[t.id] = buildTplDraft(t)
  }
}, { immediate: true })

function buildTplDraft(tpl) {
  const o = tpl.options ?? {}
  return {
    niche: o.niche ?? '',
    tone: o.tone ?? '',
    language: o.language ?? 'English',
    targetAudience: o.targetAudience ?? '',
    additionalContext: o.additionalContext ?? '',
    includeKeywords: o.includeKeywords ?? '',
    excludeKeywords: o.excludeKeywords ?? '',
  }
}

function resetTplDraft(tpl) {
  tplDrafts[tpl.id] = buildTplDraft(tpl)
}

async function commitTplName(tpl) {
  const next = (tplEditNames[tpl.id] ?? '').trim()
  if (!next || next === tpl.name) { tplEditNames[tpl.id] = tpl.name; return }
  tplRowError[tpl.id] = ''
  try {
    await updateTemplate(tpl.id, { name: next })
  } catch (e) {
    tplRowError[tpl.id] = e?.data?.statusMessage ?? 'Could not rename'
    tplEditNames[tpl.id] = tpl.name
  }
}

async function saveTplOptions(tpl) {
  tplSaving[tpl.id] = true
  tplRowError[tpl.id] = ''
  try {
    const merged = { ...(tpl.options ?? {}), ...tplDrafts[tpl.id] }
    await updateTemplate(tpl.id, { options: merged })
  } catch (e) {
    tplRowError[tpl.id] = e?.data?.statusMessage ?? 'Could not save'
  } finally {
    tplSaving[tpl.id] = false
  }
}

async function deleteTpl(id) {
  if (!confirm('Delete this template? This cannot be undone.')) return
  tplDeleting.value = id
  try {
    await removeTemplate(id)
    delete tplEditNames[id]; delete tplExpanded[id]; delete tplDrafts[id]
    delete tplSaving[id]; delete tplRowError[id]
  } catch (e) {
    tplRowError[id] = e?.data?.statusMessage ?? 'Could not delete'
  } finally {
    tplDeleting.value = null
  }
}

// New template form
const showNewTplForm  = ref(false)
const newTplSaving    = ref(false)
const newTplError     = ref('')
const newTplNameInput = ref(null)

function makeEmptyOptions() {
  return { niche: '', tone: '', language: 'English', targetAudience: '', additionalContext: '', includeKeywords: '', excludeKeywords: '' }
}
const newTpl = reactive({ name: '', options: makeEmptyOptions() })

function resetNewTpl() {
  newTpl.name = ''
  Object.assign(newTpl.options, makeEmptyOptions())
  newTplError.value = ''
}

function openNewTplForm() {
  showNewTplForm.value = true
  nextTick(() => newTplNameInput.value?.focus())
}

async function createNewTpl() {
  if (!newTpl.name.trim()) return
  newTplSaving.value = true
  newTplError.value = ''
  try {
    await createTemplate(newTpl.name.trim(), { ...newTpl.options })
    showNewTplForm.value = false
    resetNewTpl()
  } catch (e) {
    newTplError.value = e?.data?.statusMessage ?? e?.message ?? 'Could not create template'
  } finally {
    newTplSaving.value = false
  }
}

// ── Pinterest analytics import ────────────────────────────────────────────────
const MAX_CSV_BYTES = 5 * 1024 * 1024

const csvFileInput = ref(null)
const dragOver     = ref(false)
const pasteMode    = ref(false)
const pasteBuffer  = ref('')

const csvText      = ref('')
const fileName     = ref('')
const fileBytes    = ref(0)

const analyzing    = ref(false)
const analysis     = ref(null)
const analyzeError = ref('')
const showAllBoards = ref(false)
const includeSystem = ref(false)

const importing    = ref(false)
const importResult = ref(null)
const importError  = ref('')

const sizeLabel = computed(() => {
  if (!fileBytes.value) return `${csvText.value.length.toLocaleString()} chars`
  const kb = fileBytes.value / 1024
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`
})

function readFile(file) {
  analyzeError.value = ''
  if (!file) return
  const nameOk = /\.(csv|txt)$/i.test(file.name) || /text\/(csv|plain)/.test(file.type)
  if (!nameOk) { analyzeError.value = 'Please choose a .csv file exported from Pinterest.'; csvText.value = ''; return }
  if (file.size > MAX_CSV_BYTES) { analyzeError.value = 'File is larger than 5 MB.'; csvText.value = ''; return }
  const reader = new FileReader()
  reader.onload = () => {
    csvText.value = String(reader.result ?? '')
    fileName.value = file.name
    fileBytes.value = file.size
    analyze()
  }
  reader.onerror = () => { analyzeError.value = 'Could not read the file.' }
  reader.readAsText(file)
}

function onFilePicked(e) {
  readFile(e.target.files?.[0])
  e.target.value = '' // allow re-selecting the same file
}

function onDrop(e) {
  dragOver.value = false
  readFile(e.dataTransfer?.files?.[0])
}

function usePastedText() {
  csvText.value = pasteBuffer.value
  fileName.value = ''
  fileBytes.value = 0
  analyze()
}

async function analyze() {
  if (!csvText.value.trim()) return
  analyzing.value = true
  analyzeError.value = ''
  analysis.value = null
  importResult.value = null
  importError.value = ''
  showAllBoards.value = false
  try {
    analysis.value = await $fetch('/api/pinterest/import-analytics', {
      method: 'POST',
      body: { csv: csvText.value, dryRun: true, includeSystemBoards: includeSystem.value },
    })
  } catch (e) {
    analyzeError.value = e?.data?.statusMessage ?? e?.message ?? 'Could not read this CSV'
  } finally {
    analyzing.value = false
  }
}

async function runImport() {
  if (!analysis.value) return
  importing.value = true
  importError.value = ''
  try {
    importResult.value = await $fetch('/api/pinterest/import-analytics', {
      method: 'POST',
      body: { csv: csvText.value, includeSystemBoards: includeSystem.value },
    })
    // Refresh the Boards list + the AI account brief so both reflect the import.
    await Promise.all([loadBoards(true), loadProjectMeta(true)])
  } catch (e) {
    importError.value = e?.data?.statusMessage ?? e?.message ?? 'Import failed'
  } finally {
    importing.value = false
  }
}

function resetImport() {
  csvText.value = ''
  fileName.value = ''
  fileBytes.value = 0
  pasteBuffer.value = ''
  pasteMode.value = false
  analysis.value = null
  analyzeError.value = ''
  importResult.value = null
  importError.value = ''
  showAllBoards.value = false
}

// ── Project rename + delete ───────────────────────────────────────────────────
const {
  projects,
  activeProject,
  load: loadProjects,
  renameProject,
  deleteProject,
} = useMetadataProject()
const projectNameDraft = ref('')
const projectSaving = ref(false)
const projectRenameError = ref('')
const projectRenameSaved = ref(false)

const projectDeleteConfirm = ref('')
const projectDeleting = ref(false)
const projectDeleteError = ref('')

// The server refuses to delete a user's only project; reflect that in the UI.
const onlyOneProject = computed(() => (projects.value?.length ?? 0) <= 1)

const canDeleteProject = computed(() =>
  !!activeProject.value
  && !onlyOneProject.value
  && projectDeleteConfirm.value === activeProject.value.name
  && !projectDeleting.value,
)

async function handleDeleteProject() {
  if (!canDeleteProject.value) return
  projectDeleting.value = true
  projectDeleteError.value = ''
  try {
    // deleteProject() removes it server-side, then full-reloads into the
    // user's next project (it's always the active one here), so there's
    // nothing to clean up on success.
    await deleteProject(activeProject.value.id)
  } catch (e) {
    projectDeleteError.value = e?.data?.statusMessage ?? e?.message ?? 'Could not delete the project.'
    projectDeleting.value = false
  }
}

// Seed the field from the active project once it's known. The `!draft` guard
// keeps anything the user has already typed from being clobbered by a refresh.
watch(activeProject, (p) => {
  if (p && !projectNameDraft.value) projectNameDraft.value = p.name
}, { immediate: true })

// Any edit clears the prior result/error so feedback always matches the field.
watch(projectNameDraft, () => {
  projectRenameSaved.value = false
  projectRenameError.value = ''
})

const canSaveProjectName = computed(() => {
  const n = projectNameDraft.value.trim()
  return !!activeProject.value && !!n && n !== activeProject.value.name && !projectSaving.value
})

async function handleRenameProject() {
  if (!canSaveProjectName.value) return
  projectSaving.value = true
  projectRenameError.value = ''
  try {
    await renameProject(activeProject.value.id, projectNameDraft.value.trim())
    projectRenameSaved.value = true
  } catch (e) {
    projectRenameError.value = e?.data?.statusMessage ?? e?.message ?? 'Could not rename the project.'
  } finally {
    projectSaving.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadBoards(), loadSettings(), loadTemplates(), loadProjects()])
  syncDraftFromSettings()
})

// Close color picker when clicking outside.
onMounted(() => {
  const onDocClick = () => { pickerOpenFor.value = null }
  document.addEventListener('click', onDocClick)
  onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
})
</script>

<style lang="scss" scoped>
.settings-page {
  flex: 1;
  min-height: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f7f7f7;

  &__header {
    flex-shrink: 0;
    padding: 18px 28px 14px;
    background: #fff;
    border-bottom: 1px solid #ececec;
  }

  &__title {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: $color-primary;
  }

  &__subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6b7280;
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: flex;
    overflow: hidden;
  }

  &__sections-nav {
    flex-shrink: 0;
    width: 200px;
    padding: 18px 14px;
    border-right: 1px solid #ececec;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #fbfbfb;
  }

  &__section-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border: none;
    background: none;
    border-radius: 7px;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    color: #4b5563;
    text-align: left;
    transition: background 0.15s, color 0.15s;

    &:hover { background: #f3f4f6; color: $color-primary; }

    &--active {
      background: color-mix(in srgb, #{$color-accent} 10%, #fff);
      color: $color-primary;
      font-weight: 600;
    }
  }

  &__section-link-icon {
    width: 16px;
    height: 16px;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(svg) { display: block; }
  }

  &__section-link--active &__section-link-icon { color: $color-accent; }

  &__content {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 22px 28px 60px;
  }
}

.settings-card {
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  max-width: 780px;
  // Must stay visible so the board color-picker popover isn't clipped by the
  // card. Corners are kept rounded via the header's own radius below.
  overflow: visible;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid #f3f4f6;
    border-radius: 12px 12px 0 0;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: $color-primary;
  }

  &__hint {
    margin: 4px 0 0;
    font-size: 12.5px;
    color: #6b7280;
    line-height: 1.5;
  }

  &__board-warning {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: #fffbeb;
    border: 1.5px solid #fcd34d;
    border-radius: 10px;
    padding: 14px 16px;
    margin: 0 20px 16px;

    svg { color: #d97706; flex-shrink: 0; margin-top: 2px; }

    strong {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 4px;
    }

    div {
      font-size: 12.5px;
      color: #78350f;
      line-height: 1.55;
    }
  }

  &__board-tip {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: color-mix(in srgb, #{$color-accent} 6%, #fff);
    border: 1px solid color-mix(in srgb, #{$color-accent} 22%, #fff);
    border-radius: 10px;
    padding: 12px 14px;
    margin: 0 20px 12px;
    font-size: 12.5px;
    color: #374151;
    line-height: 1.55;

    svg { color: $color-accent; flex-shrink: 0; margin-top: 2px; }
    strong { color: $color-primary; }
  }

  &__link-btn {
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    font-size: inherit;
    font-weight: 600;
    color: $color-accent;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  &__count {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 999px;
    padding: 3px 10px;
    letter-spacing: 0.02em;
  }

  &__body {
    padding: 16px 20px;

    &--form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 6px;
  }

  &__empty {
    padding: 24px 4px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
  }

  &__error {
    margin: 0 0 8px;
    padding: 8px 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 7px;
    color: #b91c1c;
    font-size: 12.5px;
  }

  &__status {
    font-size: 12.5px;
    font-weight: 600;

    &--ok  { color: #16a34a; }
    &--err { color: #ef4444; }
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &--full { grid-column: 1 / -1; }

  &__label {
    font-size: 11px;
    font-weight: 700;
    color: #1f2937;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__input {
    width: 100%;
    height: 36px;
    padding: 0 10px;
    border: 1px solid #374151;
    border-radius: 7px;
    font: inherit;
    font-size: 13px;
    background: #fff;
    color: $color-primary;
    box-sizing: border-box;
    transition: border-color 0.15s;

    &:focus { outline: none; border-color: $color-accent; }

    &--textarea {
      height: auto;
      padding: 9px 10px;
      resize: vertical;
      line-height: 1.5;
      font-family: inherit;
    }
  }

  &__hint {
    font-size: 11.5px;
    color: #9ca3af;
  }
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #f9fafb;
  font: inherit;
  font-size: 13px;
  color: $color-primary;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover:not(:disabled) { background: #f3f4f6; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--primary {
    background: $color-accent;
    border-color: $color-accent;
    color: #fff;
    font-weight: 600;

    &:hover { background: color-mix(in srgb, #{$color-accent} 94%, #000); border-color: color-mix(in srgb, #{$color-accent} 94%, #000); }
  }

  &--ghost-danger {
    background: transparent;
    border-color: transparent;
    color: #9ca3af;
    width: 30px;
    height: 30px;
    padding: 0;

    &:hover:not(:disabled) {
      background: #fef2f2;
      border-color: #fecaca;
      color: #b91c1c;
    }
  }

  &--danger {
    background: #dc2626;
    border-color: #dc2626;
    color: #fff;
    font-weight: 600;
    align-self: flex-start;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.05s;

    // Hover: pop to a brighter, more saturated red with a red focus ring so
    // the destructive action is clearly highlighted. Text stays white.
    &:hover:not(:disabled) {
      background: #ef4444;
      border-color: #ef4444;
      color: #fff;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.28);
    }

    &:active:not(:disabled) { transform: translateY(1px); }

    // Disabled: muted red on light red — clearly inactive but still readable
    // (no white-on-grey). Overrides the base 0.5 opacity.
    &:disabled {
      background: #fae3e3;
      border-color: #f3c9c9;
      color: #c2554f;
      opacity: 1;
    }
  }
}

// ── Project rename row ─────────────────────────────────────────────────────────
.project-rename {
  display: flex;
  gap: 8px;
  align-items: stretch;
  max-width: 460px;

  .settings-field__input { flex: 1; }
  .settings-btn { flex-shrink: 0; height: 36px; }
}

// ── Danger zone ────────────────────────────────────────────────────────────────
.danger-zone {
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef6f6;
  padding: 18px;

  &__head {
    display: flex;
    gap: 12px;
    align-items: flex-start;

    svg { color: #dc2626; flex-shrink: 0; margin-top: 1px; }
  }

  &__title {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 700;
    color: #991b1b;
  }

  &__text {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.55;
    color: #7f1d1d;
    max-width: 60ch;
  }

  &__confirm {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #fecaca;
    max-width: 320px;
  }

  &__label {
    font-size: 12px;
    color: #7f1d1d;

    strong { font-weight: 700; letter-spacing: 0.04em; }
  }

  &__locked {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #fecaca;
    font-size: 12.5px;
    line-height: 1.55;
    color: #7f1d1d;
  }

  &__spin { animation: danger-zone-spin 0.8s linear infinite; }
}

@keyframes danger-zone-spin { to { transform: rotate(360deg); } }

// ── Board rows ─────────────────────────────────────────────────────────────────
.board-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.board-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px;
  border-radius: 9px;
  position: relative;
  transition: background 0.12s;

  &:hover { background: #fafafa; }

  &--new {
    background: #fafafa;
    margin-bottom: 12px;
    padding: 10px;
  }

  &__swatch {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s, border-color 0.12s;

    &:hover {
      border-color: #d1d5db;
      transform: scale(1.04);
    }
  }

  &__swatch-auto {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
  }

  &__name-input {
    flex: 1;
    min-width: 0;
    height: 32px;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 7px;
    font: inherit;
    font-size: 13.5px;
    color: $color-primary;
    background: transparent;
    transition: border-color 0.15s, background 0.15s;
    box-sizing: border-box;

    &:hover { background: #fff; border-color: #e5e7eb; }
    &:focus { outline: none; background: #fff; border-color: $color-accent; }
  }

  &--new &__name-input {
    background: #fff;
    border-color: #e5e7eb;
  }

  &__error {
    color: #b91c1c;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
  }

  &__picker {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 20;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    min-width: 220px;
  }

  &__picker-label {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__palette {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }

  &__palette-swatch {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: transform 0.12s, border-color 0.12s;

    &:hover { transform: scale(1.06); }

    &--active {
      border-color: $color-primary;
    }

    &--clear {
      background: #fafafa;
      color: #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__hex {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #f3f4f6;
  }

  &__hex-prefix {
    font-size: 13px;
    font-weight: 700;
    color: #9ca3af;
  }

  &__hex-input {
    flex: 1;
    min-width: 0;
    height: 30px;
    padding: 0 8px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font: inherit;
    font-size: 13px;
    font-family: monospace;
    color: $color-primary;
    background: #fff;
    box-sizing: border-box;

    &:focus { outline: none; border-color: $color-accent; }
  }

  &__hex-btn {
    flex-shrink: 0;
    height: 30px;
    padding: 0 12px;
    border: 1px solid $color-accent;
    border-radius: 7px;
    background: $color-accent;
    color: #fff;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 52px;

    &:hover:not(:disabled) { background: color-mix(in srgb, #{$color-accent} 90%, #000); }
    &:disabled { opacity: 0.7; cursor: not-allowed; }
    &:focus-visible { outline: 2px solid $color-accent; outline-offset: 2px; }
  }

  &__hex-spin {
    animation: hex-spin 0.8s linear infinite;
  }

  @keyframes hex-spin {
    to { transform: rotate(360deg); }
  }

  &__hex-error {
    margin: 6px 0 0;
    font-size: 11.5px;
    font-weight: 500;
    color: #b91c1c;
  }
}

// ── AI Templates section ───────────────────────────────────────────────────────
.tpl-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.tpl-row {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    background: #fafafa;
  }

  &__name-input {
    flex: 1;
    min-width: 0;
    height: 30px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 6px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: $color-primary;
    background: transparent;
    transition: border-color 0.12s, background 0.12s;

    &:hover { border-color: #e5e7eb; background: #fff; }
    &:focus { outline: none; border-color: $color-accent; background: #fff; }
  }

  &__expand {
    width: 28px;
    height: 28px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.12s, color 0.12s;

    &:hover { background: #f3f4f6; color: $color-primary; }
  }

  &__err {
    margin: 0;
    padding: 4px 12px 6px;
    font-size: 11.5px;
    color: #dc2626;
  }

  &__form {
    padding: 14px 14px 12px;
    border-top: 1px solid #f3f4f6;
  }

  &__form-foot {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
  }
}

.tpl-new-form {
  margin-top: 4px;
  padding: 14px;
  border: 1.5px dashed #d1d5db;
  border-radius: 10px;
  background: #fafafa;
  margin-bottom: 12px;
}

.tpl-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.tpl-form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &--full { grid-column: 1 / -1; }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__input {
    width: 100%;
    height: 32px;
    padding: 0 8px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font: inherit;
    font-size: 13px;
    background: #fff;
    color: $color-primary;
    box-sizing: border-box;
    transition: border-color 0.12s;

    &:focus { outline: none; border-color: $color-accent; }

    &--textarea {
      height: auto;
      padding: 7px 8px;
      resize: vertical;
      line-height: 1.45;
    }
  }
}

// ── Pinterest CSV Import ───────────────────────────────────────────────────────
.csv-import {

  // Info callout
  &__info {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    background: #f0f9ff;
    border: 1.5px solid #bae6fd;
    border-radius: 10px;
    padding: 16px 18px;
  }

  &__info-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #0ea5e9;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin-top: 1px;
  }

  &__info-body {
    flex: 1;
    min-width: 0;
  }

  &__info-title {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #0c4a6e;
    margin-bottom: 6px;
  }

  &__info-text {
    margin: 0 0 10px;
    font-size: 12.5px;
    color: #075985;
    line-height: 1.55;
  }

  &__info-steps {
    margin: 0 0 10px;
    padding-left: 18px;
    font-size: 12.5px;
    color: #075985;
    line-height: 1.65;

    li + li { margin-top: 3px; }
    strong { color: #0c4a6e; }
  }

  &__info-note {
    margin: 0;
    font-size: 11.5px;
    color: #0369a1;
    line-height: 1.5;

    code {
      font-family: 'SFMono-Regular', Consolas, monospace;
      background: #e0f2fe;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 11px;
    }
  }

  // Drop zone
  &__dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 24px;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    background: #fafafa;
    cursor: pointer;
    text-align: center;
    transition: border-color 0.2s, background 0.2s;
    outline: none;

    &:hover,
    &:focus-visible {
      border-color: $color-accent;
      background: color-mix(in srgb, #{$color-accent} 4%, #fff);
    }
  }

  &__dropzone-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    margin-bottom: 4px;
    transition: background 0.2s, color 0.2s;

    .csv-import__dropzone:hover &,
    .csv-import__dropzone:focus-visible & {
      background: color-mix(in srgb, #{$color-accent} 12%, #fff);
      color: $color-accent;
    }
  }

  &__dropzone-headline {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: $color-primary;
  }

  &__dropzone-sub {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
  }

  &__dropzone-browse {
    color: $color-accent;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 2px;
    transition: text-decoration-color 0.15s;

    .csv-import__dropzone:hover & { text-decoration-color: $color-accent; }
  }

  &__dropzone-constraint {
    margin: 4px 0 0;
    font-size: 11.5px;
    color: #9ca3af;

    code {
      font-family: 'SFMono-Regular', Consolas, monospace;
      background: #f3f4f6;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 11px;
    }
  }

  // File validation feedback
  &__feedback {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1.5px solid #d1d5db;
    background: #fff;

    &--success {
      border-color: #bbf7d0;
      background: #f0fdf4;
    }

    &--error {
      border-color: #fecaca;
      background: #fef2f2;
    }
  }

  &__feedback-icon {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &--success { background: #22c55e; color: #fff; }
    &--error   { background: #ef4444; color: #fff; }
  }

  &__feedback-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__feedback-name {
    font-size: 13px;
    font-weight: 600;
    color: $color-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__feedback-size {
    font-size: 11.5px;
    color: #6b7280;
  }

  &__feedback-remove {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s, color 0.15s;

    &:hover { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
  }

  // Board names preview
  &__preview {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
  }

  &__preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 16px;
    background: #fafafa;
    border-bottom: 1px solid #f3f4f6;
  }

  &__preview-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #374151;
  }

  &__preview-badge {
    font-size: 11px;
    font-weight: 700;
    color: $color-accent;
    background: color-mix(in srgb, #{$color-accent} 10%, #fff);
    border-radius: 999px;
    padding: 2px 9px;
    letter-spacing: 0.02em;
  }

  &__board-list {
    list-style: none;
    margin: 0;
    padding: 8px 0;
  }

  &__board-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 16px;
    font-size: 13px;
    color: $color-primary;
    transition: background 0.12s;

    svg { color: #9ca3af; flex-shrink: 0; }

    &:hover { background: #f9fafb; }

    &--more {
      font-size: 12px;
      color: #9ca3af;
      font-style: italic;
      padding-left: 38px;
    }
  }

  &__preview-note {
    margin: 0;
    padding: 10px 16px 12px;
    font-size: 11.5px;
    color: #6b7280;
    line-height: 1.5;
    border-top: 1px solid #f3f4f6;

    strong { color: $color-primary; }
  }

  // Coming soon label
  &__coming-soon {
    font-size: 11.5px;
    color: #9ca3af;
    font-style: italic;
    margin-left: 4px;
  }

  // ── Functional bits ──────────────────────────────────────────────────────
  &__file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  &__dropzone--drag {
    border-color: $color-accent;
    background: color-mix(in srgb, #{$color-accent} 7%, #fff);
  }

  &__paste-toggle {
    margin-top: 10px;
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 12px;
    color: #6b7280;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover { color: $color-accent; }
  }

  &__summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid #f3f4f6;

    span {
      font-size: 11.5px;
      font-weight: 600;
      color: #475569;
      background: #f3f4f6;
      border-radius: 999px;
      padding: 3px 10px;

      strong { color: $color-primary; }
    }
  }

  &__board-tag {
    margin-left: auto;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #15803d;
    background: #dcfce7;
    border-radius: 999px;
    padding: 2px 7px;
  }

  &__board-item--more { cursor: pointer; }

  &__opt {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: #4b5563;
    cursor: pointer;

    input { accent-color: $color-accent; }
  }
}
</style>
