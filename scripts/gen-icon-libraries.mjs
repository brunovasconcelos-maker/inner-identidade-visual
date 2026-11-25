// Generates src/icon-libraries/*: for each library and style, one module with the SVGs of a
// curated set of everyday icons (static ?raw imports), so the app loads one small chunk per
// library style. Run: node scripts/gen-icon-libraries.mjs
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const NM = 'node_modules'
// [concept, material, remix, phosphor, lucide, heroicons]; '' = the library has no such icon.
// The first 24 are the concepts of the folder cards, so every card shows the same set.
const CONCEPTS = [
  ['home', 'home', 'home-4', 'house', 'house', 'home'],
  ['heart', 'favorite', 'heart', 'heart', 'heart', 'heart'],
  ['star', 'star', 'star', 'star', 'star', 'star'],
  ['user', 'person', 'user', 'user', 'user', 'user'],
  ['search', 'search', 'search', 'magnifying-glass', 'search', 'magnifying-glass'],
  ['bell', 'notifications', 'notification', 'bell', 'bell', 'bell'],
  ['camera', 'photo_camera', 'camera', 'camera', 'camera', 'camera'],
  ['mail', 'mail', 'mail', 'envelope', 'mail', 'envelope'],
  ['globe', 'language', 'global', 'globe', 'globe', 'globe-alt'],
  ['lock', 'lock', 'lock', 'lock', 'lock', 'lock-closed'],
  ['settings', 'settings', 'settings-3', 'gear', 'settings', 'cog-6-tooth'],
  ['calendar', 'calendar_month', 'calendar', 'calendar', 'calendar', 'calendar'],
  ['cart', 'shopping_cart', 'shopping-cart', 'shopping-cart', 'shopping-cart', 'shopping-cart'],
  ['chat', 'chat_bubble', 'chat-1', 'chat-circle', 'message-circle', 'chat-bubble-left'],
  ['map-pin', 'location_on', 'map-pin', 'map-pin', 'map-pin', 'map-pin'],
  ['phone', 'call', 'phone', 'phone', 'phone', 'phone'],
  ['clock', 'schedule', 'time', 'clock', 'clock', 'clock'],
  ['cloud', 'cloud', 'cloud', 'cloud', 'cloud', 'cloud'],
  ['sun', 'light_mode', 'sun', 'sun', 'sun', 'sun'],
  ['moon', 'dark_mode', 'moon', 'moon', 'moon', 'moon'],
  ['bookmark', 'bookmark', 'bookmark', 'bookmark-simple', 'bookmark', 'bookmark'],
  ['book', 'menu_book', 'book-open', 'book-open', 'book-open', 'book-open'],
  ['image', 'image', 'image', 'image', 'image', 'photo'],
  ['video', 'videocam', 'vidicon', 'video-camera', 'video', 'video-camera'],
  ['music', 'music_note', 'music', 'music-note', 'music', 'musical-note'],
  ['play', 'play_arrow', 'play', 'play', 'play', 'play'],
  ['pause', 'pause', 'pause', 'pause', 'pause', 'pause'],
  ['download', 'download', 'download', 'download-simple', 'download', 'arrow-down-tray'],
  ['upload', 'upload', 'upload', 'upload-simple', 'upload', 'arrow-up-tray'],
  ['share', 'share', 'share', 'share-network', 'share-2', 'share'],
  ['link', 'link', 'link', 'link', 'link', 'link'],
  ['edit', 'edit', 'edit', 'pencil-simple', 'pencil', 'pencil'],
  ['trash', 'delete', 'delete-bin', 'trash', 'trash-2', 'trash'],
  ['check', 'check', 'check', 'check', 'check', 'check'],
  ['close', 'close', 'close', 'x', 'x', 'x-mark'],
  ['plus', 'add', 'add', 'plus', 'plus', 'plus'],
  ['minus', 'remove', 'subtract', 'minus', 'minus', 'minus'],
  ['arrow-right', 'arrow_forward', 'arrow-right', 'arrow-right', 'arrow-right', 'arrow-right'],
  ['arrow-left', 'arrow_back', 'arrow-left', 'arrow-left', 'arrow-left', 'arrow-left'],
  ['arrow-up', 'arrow_upward', 'arrow-up', 'arrow-up', 'arrow-up', 'arrow-up'],
  ['arrow-down', 'arrow_downward', 'arrow-down', 'arrow-down', 'arrow-down', 'arrow-down'],
  ['menu', 'menu', 'menu', 'list', 'menu', 'bars-3'],
  ['filter', 'filter_alt', 'filter', 'funnel', 'funnel', 'funnel'],
  ['folder', 'folder', 'folder', 'folder', 'folder', 'folder'],
  ['file', 'description', 'file-text', 'file', 'file', 'document'],
  ['flag', 'flag', 'flag', 'flag', 'flag', 'flag'],
  ['gift', 'redeem', 'gift', 'gift', 'gift', 'gift'],
  ['tag', 'sell', 'price-tag-3', 'tag', 'tag', 'tag'],
  ['key', 'key', 'key', 'key', 'key', 'key'],
  ['shield', 'shield', 'shield', 'shield', 'shield', 'shield-check'],
  ['eye', 'visibility', 'eye', 'eye', 'eye', 'eye'],
  ['thumbs-up', 'thumb_up', 'thumb-up', 'thumbs-up', 'thumbs-up', 'hand-thumb-up'],
  ['wifi', 'wifi', 'wifi', 'wifi-high', 'wifi', 'wifi'],
  ['battery', 'battery_full', 'battery-2', 'battery-full', 'battery-full', 'battery-50'],
  ['bluetooth', 'bluetooth', 'bluetooth', 'bluetooth', 'bluetooth', ''],
  ['bag', 'shopping_bag', 'shopping-bag', 'shopping-bag', 'shopping-bag', 'shopping-bag'],
  ['credit-card', 'credit_card', 'bank-card', 'credit-card', 'credit-card', 'credit-card'],
  ['wallet', 'wallet', 'wallet', 'wallet', 'wallet', 'wallet'],
  ['chart-bar', 'bar_chart', 'bar-chart', 'chart-bar', 'chart-bar', 'chart-bar'],
  ['chart-pie', 'pie_chart', 'pie-chart', 'chart-pie', 'chart-pie', 'chart-pie'],
  ['lightbulb', 'lightbulb', 'lightbulb', 'lightbulb', 'lightbulb', 'light-bulb'],
  ['rocket', 'rocket_launch', 'rocket', 'rocket', 'rocket', 'rocket-launch'],
  ['trophy', 'emoji_events', 'trophy', 'trophy', 'trophy', 'trophy'],
  ['coffee', 'coffee', 'cup', 'coffee', 'coffee', ''],
  ['car', 'directions_car', 'car', 'car', 'car', ''],
  ['airplane', 'flight', 'flight-takeoff', 'airplane', 'plane', 'paper-airplane'],
  ['bicycle', 'directions_bike', 'riding', 'bicycle', 'bike', ''],
  ['tree', 'park', 'plant', 'tree', 'tree-pine', ''],
  ['leaf', 'eco', 'leaf', 'leaf', 'leaf', ''],
  ['fire', 'local_fire_department', 'fire', 'fire', 'flame', 'fire'],
  ['bolt', 'bolt', 'flashlight', 'lightning', 'zap', 'bolt'],
  ['umbrella', 'umbrella', 'umbrella', 'umbrella', 'umbrella', ''],
  ['headphones', 'headphones', 'headphone', 'headphones', 'headphones', ''],
  ['microphone', 'mic', 'mic', 'microphone', 'mic', 'microphone'],
  ['mobile', 'smartphone', 'smartphone', 'device-mobile', 'smartphone', 'device-phone-mobile'],
  ['laptop', 'laptop', 'macbook', 'laptop', 'laptop', 'computer-desktop'],
  ['printer', 'print', 'printer', 'printer', 'printer', 'printer'],
  ['palette', 'palette', 'palette', 'palette', 'palette', 'swatch'],
  ['brush', 'brush', 'brush', 'paint-brush', 'brush', 'paint-brush'],
  ['scissors', 'content_cut', 'scissors-cut', 'scissors', 'scissors', 'scissors'],
  ['hammer', 'hardware', 'hammer', 'hammer', 'hammer', ''],
  ['wrench', 'build', 'tools', 'wrench', 'wrench', 'wrench'],
  ['puzzle', 'extension', 'puzzle', 'puzzle-piece', 'puzzle', 'puzzle-piece'],
  ['smiley', 'sentiment_satisfied', 'emotion-happy', 'smiley', 'smile', 'face-smile'],
  ['hand', 'back_hand', 'hand', 'hand', 'hand', 'hand-raised'],
  ['compass', 'explore', 'compass-3', 'compass', 'compass', ''],
  ['target', 'target', 'focus-3', 'target', 'target', ''],
  ['layers', 'layers', 'stack', 'stack', 'layers', 'square-3-stack-3d'],
  ['grid', 'grid_view', 'grid', 'squares-four', 'layout-grid', 'squares-2x2'],
  ['code', 'code', 'code-s-slash', 'code', 'code', 'code-bracket'],
  ['database', 'database', 'database-2', 'database', 'database', 'circle-stack'],
  ['server', 'dns', 'server', 'hard-drives', 'server', 'server'],
  ['trending', 'trending_up', 'line-chart', 'trend-up', 'trending-up', 'arrow-trending-up'],
  ['percent', 'percent', 'percent', 'percent', 'percent', ''],
  ['money', 'payments', 'money-dollar-circle', 'money', 'banknote', 'banknotes'],
  ['building', 'apartment', 'building', 'buildings', 'building', 'building-office'],
  ['school', 'school', 'graduation-cap', 'graduation-cap', 'graduation-cap', 'academic-cap'],
  ['sparkle', 'auto_awesome', 'sparkling', 'sparkle', 'sparkles', 'sparkles'],
  ['bug', 'bug_report', 'bug', 'bug', 'bug', ''],
  ['plug', 'power', 'plug', 'plug', 'plug', ''],
  ['ticket', 'confirmation_number', 'ticket', 'ticket', 'ticket', 'ticket'],
  ['crown', '', 'vip-crown', 'crown', 'crown', ''],
  ['anchor', 'anchor', 'anchor', 'anchor', 'anchor', ''],
  ['mountain', 'landscape', 'landscape', 'mountains', 'mountain', ''],
  ['sound', 'volume_up', 'volume-up', 'speaker-high', 'volume-2', 'speaker-wave'],
  ['save', 'save', 'save', 'floppy-disk', 'save', ''],
  ['copy', 'content_copy', 'file-copy', 'copy', 'copy', 'document-duplicate'],
  ['refresh', 'refresh', 'refresh', 'arrow-clockwise', 'refresh-cw', 'arrow-path'],
  ['info', 'info', 'information', 'info', 'info', 'information-circle'],
  ['warning', 'warning', 'alert', 'warning', 'triangle-alert', 'exclamation-triangle'],
  ['question', 'help', 'question', 'question', 'circle-help', 'question-mark-circle'],
]
const EVERYDAY = 24

const remixFiles = new Map()
for (const category of readdirSync(join(NM, 'remixicon/icons'))) {
  for (const file of readdirSync(join(NM, 'remixicon/icons', category))) {
    remixFiles.set(file, `remixicon/icons/${category}/${file}`)
  }
}

// Style id -> file of an icon name, or null when it does not exist.
const LIBRARIES = {
  material: {
    column: 1,
    styles: ['outlined', 'rounded', 'sharp'],
    file: (name, style) => `@material-symbols/svg-400/${style}/${name}.svg`,
    disk: (name, style) => join(NM, `@material-symbols/svg-400/${style}/${name}.svg`),
  },
  remix: {
    column: 2,
    styles: ['line', 'fill'],
    file: (name, style) => remixFiles.get(`${name}-${style}.svg`) || null,
    disk: (name, style) => (remixFiles.has(`${name}-${style}.svg`) ? 'ok' : null),
  },
  phosphor: {
    column: 3,
    styles: ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'],
    file: (name, style) => `@phosphor-icons/core/assets/${style}/${name}${style === 'regular' ? '' : `-${style}`}.svg`,
    disk: (name, style) =>
      join(NM, `@phosphor-icons/core/assets/${style}/${name}${style === 'regular' ? '' : `-${style}`}.svg`),
  },
  lucide: {
    column: 4,
    styles: ['default'],
    file: (name) => `lucide-static/icons/${name}.svg`,
    disk: (name) => join(NM, `lucide-static/icons/${name}.svg`),
  },
  hero: {
    column: 5,
    styles: ['outline', 'solid'],
    file: (name, style) => `heroicons/24/${style}/${name}.svg`,
    disk: (name, style) => join(NM, `heroicons/24/${style}/${name}.svg`),
  },
}

mkdirSync('src/icon-libraries/styles', { recursive: true })
const names = {}
const loaders = []
for (const [id, lib] of Object.entries(LIBRARIES)) {
  const kept = []
  CONCEPTS.forEach((row, index) => {
    const name = row[lib.column]
    const everyStyle = name && lib.styles.every((style) => lib.disk(name, style) && (lib.disk(name, style) === 'ok' || existsSync(lib.disk(name, style))))
    if (everyStyle) kept.push({ name, index })
    else if (index < EVERYDAY) throw new Error(`${id}: everyday concept "${row[0]}" (${name}) is missing`)
    else console.warn(`skip ${id}: ${row[0]} (${name || 'none'})`)
  })
  names[id] = kept.map((item) => item.name)
  for (const style of lib.styles) {
    const lines = kept.map((item, i) => `import i${i} from '${lib.file(item.name, style)}?raw'`)
    const body = `export default {\n${kept.map((item, i) => `  '${item.name}': i${i},`).join('\n')}\n}\n`
    writeFileSync(`src/icon-libraries/styles/${id}-${style}.js`, `// Generated by scripts/gen-icon-libraries.mjs. Do not edit.\n${lines.join('\n')}\n${body}`)
    loaders.push(`  '${id}:${style}': () => import('./styles/${id}-${style}.js'),`)
  }
}
writeFileSync(
  'src/icon-libraries/names.js',
  `// Generated by scripts/gen-icon-libraries.mjs. Do not edit.\n// Icon names of each library. The first ${EVERYDAY} are the same everyday concepts in every library.\nexport const EVERYDAY_COUNT = ${EVERYDAY}\nexport const ICON_NAMES = ${JSON.stringify(names, null, 2)}\n`,
)
writeFileSync(
  'src/icon-libraries/loaders.js',
  `// Generated by scripts/gen-icon-libraries.mjs. Do not edit.\n// One lazy chunk per library style.\nexport const STYLE_LOADERS = {\n${loaders.join('\n')}\n}\n`,
)
console.log(Object.fromEntries(Object.entries(names).map(([k, v]) => [k, v.length])))
