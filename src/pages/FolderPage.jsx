import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { SlidersHorizontal } from '@phosphor-icons/react'
import ManualLink from '../components/manual/ManualLink.jsx'
import PageContainer from '../components/PageContainer.jsx'
import Breadcrumb from '../components/Breadcrumb.jsx'
import ExpandableSearch from '../components/ExpandableSearch.jsx'
import AddCard from '../components/AddCard.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LogoViewer from '../components/logo/LogoViewer.jsx'
import LogoCard from '../components/logo/LogoCard.jsx'
import ColorCard from '../components/palette/ColorCard.jsx'
import FontCard from '../components/typography/FontCard.jsx'
import TypeChooserModal from '../components/TypeChooserModal.jsx'
import NewFontModal from '../components/typography/NewFontModal.jsx'
import ColorViewer from '../components/palette/ColorViewer.jsx'
import NewPaletteModal from '../components/palette/NewPaletteModal.jsx'
import GeneratePaletteModal from '../components/palette/GeneratePaletteModal.jsx'
import GeneratingCard from '../components/palette/GeneratingCard.jsx'
import { newId } from '../data/identities.jsx'
import { categoryText } from '../data/paletteTexts.js'
import { generatePaletteColors } from '../data/colorGeneration.js'
import NewLogoModal from '../components/logo/NewLogoModal.jsx'
import SelectionBar from '../components/logo/SelectionBar.jsx'
import { useIdentities } from '../data/identities.jsx'
import { findFolder } from '../data/folders.jsx'
import { kindForSection } from '../data/assetKinds.js'
import { LOGO_TYPES, sortLogos, usedLogoTypes } from '../data/logoTypes.js'
import { CATEGORIES, CATEGORY_ORDER, generateTones, sortColors } from '../data/palette.js'
import { FONT_TYPES, findFontType, sortFonts, usedFontTypes } from '../data/typography.js'
import { googleFamilyPage } from '../data/googleFonts.js'
import { normalize } from '../utils/format.js'
import {
  isImageFormat,
  openFilePicker,
  readImageSize,
  validateElementFile,
  validateImageFile,
} from '../utils/files.js'
import { downloadFonts, downloadLogos } from '../utils/download.js'
import { FONT_ACCEPT, readFontUpload, validateFontFile } from '../utils/fontFiles.js'

// The search filters logo cards by type name and tags (case and accent insensitive).
function logoMatches(logo, label, term, searchFormat) {
  return (
    normalize(label).includes(term) ||
    (searchFormat && normalize(logo.format).includes(term)) ||
    logo.tags.some((tag) => normalize(tag).includes(term))
  )
}

export default function FolderPage() {
  const { id, section } = useParams()
  const { identities, loading, addLogo, addItems, updateLogo, updatePaletteColor, deleteLogos } = useIdentities()
  const identity = identities.find((item) => item.id === id)
  const folder = findFolder(section)

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [upload, setUpload] = useState(null) // file chosen for the "Nova logo" modal
  const [uploadError, setUploadError] = useState(null)
  const [selectedIds, setSelectedIds] = useState([]) // selected logo cards
  const [menuLogoId, setMenuLogoId] = useState(null) // logo card with its kebab menu open
  const [shareTip, setShareTip] = useState(null) // 'toolbar' or a logo id
  const [deleteTarget, setDeleteTarget] = useState(null) // logo ids waiting for confirmation
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [viewerId, setViewerId] = useState(null) // logo open in the viewer
  const [paletteOpen, setPaletteOpen] = useState(false) // "Nova paleta" modal
  const [generateOpen, setGenerateOpen] = useState(false) // "Gerar paleta" modal
  const [pending, setPending] = useState([]) // colors being generated: [{ id, category }]
  const [fontModal, setFontModal] = useState(null) // "Nova tipografia": { mode, type, font }
  const [chooser, setChooser] = useState(null) // type chooser: 'logo' | 'font-upload' | 'font-google'
  const shareTimer = useRef(null)

  // Logo and Ícone share the whole flow (cards, upload modal, viewer, actions).
  const kind = kindForSection(section)
  const isPalette = section === 'paleta-de-cores'
  const isTypo = section === 'tipografia'
  const items = identity && folder ? identity[folder.key] : []
  const logos = useMemo(() => {
    if (!kind || !identity) return []
    if (kind.newestFirst) return [...identity[kind.key]].reverse()
    return kind.hasType ? sortLogos(identity[kind.key]) : identity[kind.key]
  }, [kind, identity])
  const visibleLogos = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return logos
    return logos.filter((logo) => logoMatches(logo, kind.label(logo), term, kind.anyFile))
  }, [logos, kind, query])
  // Colors of the palette folder: brand, primary, secondary. The search looks at the name,
  // the hex and the category label.
  const colors = useMemo(
    () => (isPalette && identity ? sortColors(identity.paleta) : []),
    [isPalette, identity],
  )
  const visibleColors = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return colors
    return colors.filter(
      (color) =>
        normalize(color.name).includes(term) ||
        normalize(color.hex).includes(term) ||
        normalize(color.hex.slice(1)).includes(term) ||
        normalize(CATEGORIES[color.category].cardLabel).includes(term),
    )
  }, [colors, query])
  // Fonts, by type. The search looks at the family, the type label and the tags.
  const fonts = useMemo(
    () => (isTypo && identity ? sortFonts(identity.tipografia) : []),
    [isTypo, identity],
  )
  const visibleFonts = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return fonts
    return fonts.filter(
      (font) =>
        normalize(font.family).includes(term) ||
        normalize(findFontType(font.type).label).includes(term) ||
        font.tags.some((tag) => normalize(tag).includes(term)),
    )
  }, [fonts, query])
  const visibleCards = isPalette ? visibleColors : isTypo ? visibleFonts : visibleLogos

  // Items of this folder that match the search. Nothing renders them yet, but the
  // filter is in place for when items exist. The add cards are never filtered.
  const visibleItems = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return items
    return items.filter((item) => normalize(item.name || '').includes(term))
  }, [items, query])

  // Only logos that are still visible stay selected (deleted or filtered out ones leave).
  useEffect(() => {
    const visible = new Set(visibleCards.map((card) => card.id))
    setSelectedIds((current) => {
      const next = current.filter((cardId) => visible.has(cardId))
      return next.length === current.length ? current : next
    })
  }, [visibleCards])

  useEffect(() => {
    // The kebab menu closes itself on Esc (capture phase), so this only sees Esc when
    // no menu is open. Esc closes the delete dialog, otherwise clears the selection.
    function onKeyDown(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (deleteTarget) {
        if (!deleting) {
          setDeleteTarget(null)
          setDeleteError(null)
        }
        return
      }
      if (upload || searchOpen || viewerId || paletteOpen || generateOpen || fontModal) return
      if (selectedIds.length > 0) setSelectedIds([])
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [deleteTarget, deleting, upload, searchOpen, selectedIds, viewerId, paletteOpen, generateOpen, fontModal])

  useEffect(() => () => clearTimeout(shareTimer.current), [])

  const closeMenu = useCallback(() => setMenuLogoId(null), [])

  useEffect(() => {
    if (!uploadError) return undefined
    const timer = setTimeout(() => setUploadError(null), 5000)
    return () => clearTimeout(timer)
  }, [uploadError])

  if (loading) return null
  if (!identity) return <Navigate to="/" replace />
  if (!folder) return <Navigate to={`/id/${id}`} replace />

  const total = items.length

  // Colors of the grid with the placeholders of the colors being generated, in the order
  // brand, primary, secondary. A placeholder gives way as soon as its color is saved.
  const savedIds = new Set(identity.paleta.map((color) => color.id))
  const rank = (category) => CATEGORY_ORDER.indexOf(category)
  const gridColors = [
    ...visibleColors.map((color) => ({ color })),
    ...pending.filter((item) => !savedIds.has(item.id)).map((item) => ({ pending: item })),
  ].sort(
    (a, b) =>
      rank(a.color ? a.color.category : a.pending.category) - rank(b.color ? b.color.category : b.pending.category),
  )

  // Opens the native file picker. A valid file opens the "Nova logo" modal; an
  // invalid one shows a short message near the card and the modal stays closed.
  // `type` is the logo type picked in the chooser (Ícone and Elementos have none).
  async function handleUpload(type) {
    setUploadError(null)
    // Elementos accept any file type (up to 50 MB); the other folders only images.
    const file = await openFilePicker(kind.anyFile ? '' : undefined)
    if (!file) return
    const result = kind.anyFile ? validateElementFile(file) : validateImageFile(file)
    if (!result.ok) {
      setUploadError(result.error)
      return
    }
    const size = !kind.anyFile || isImageFormat(result.format) ? await readImageSize(file) : {}
    setUpload({ file, format: result.format, ...(kind.hasType ? { type } : {}), ...size })
  }

  // "Gerar paleta": "Criar" closes the modal and puts one placeholder per color in the grid.
  // The colors are generated meanwhile; after 1.5 s the placeholders are filled one by one,
  // 400 ms apart, each one saved to the "paleta" array with its tones.
  async function handleGenerate({ files, counts }) {
    const plan = []
    for (const category of CATEGORY_ORDER) {
      for (let n = 0; n < (counts[category] || 0); n += 1) plan.push({ id: newId(), category })
    }
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    setUploadError(null)
    setPending(plan)
    try {
      const brand = identity.paleta.find((color) => color.category === 'marca')
      const [generated] = await Promise.all([
        generatePaletteColors({
          files,
          counts,
          existing: identity.paleta.map((color) => color.hex),
          existingNames: identity.paleta.map((color) => color.name),
          existingBrand: brand ? brand.hex : null,
          identityName: identity.name,
        }),
        wait(1500),
      ])
      for (let i = 0; i < generated.length; i += 1) {
        if (i > 0) await wait(400)
        const color = generated[i]
        await addItems(
          identity.id,
          [
            {
              id: plan[i].id,
              category: color.category,
              name: color.name,
              hex: color.hex,
              tones: generateTones(color.hex),
              createdAt: new Date().toISOString(),
            },
          ],
          'paleta',
        )
      }
    } catch (error) {
      console.error('Could not generate the palette', error)
      setUploadError('Não foi possível gerar a paleta')
    } finally {
      setPending([])
    }
  }

  function toggleSelect(logoId) {
    setSelectedIds((current) =>
      current.includes(logoId) ? current.filter((item) => item !== logoId) : [...current, logoId],
    )
  }

  // No backend yet: sharing only shows a short "Em breve" tooltip.
  function showShareTip(key) {
    setShareTip(key)
    clearTimeout(shareTimer.current)
    shareTimer.current = setTimeout(() => setShareTip(null), 2000)
  }

  async function handleDownload(ids) {
    const chosen = logos.filter((logo) => ids.includes(logo.id))
    if (chosen.length === 0) return
    try {
      await downloadLogos(identity.name, chosen, kind)
    } catch (error) {
      console.error('Could not download', error)
    }
  }

  // The add card picks one font file or one .zip. A valid pick opens "Nova tipografia";
  // an invalid one shows a short message near the card.
  async function handleFontUpload(type) {
    setUploadError(null)
    const file = await openFilePicker(FONT_ACCEPT)
    if (!file) return
    const result = validateFontFile(file)
    if (!result.ok) {
      setUploadError(result.error)
      return
    }
    const read = await readFontUpload(file, result.zip)
    if (!read.ok) {
      setUploadError(read.error)
      return
    }
    setFontModal({ mode: 'upload', type, font: { family: read.family, weights: read.weights } })
  }

  // Google fonts have no files: "Baixar" opens the family page in a new tab. Uploaded fonts
  // download their file or a .zip.
  async function downloadFontsOf(list) {
    const googleOnly = list.length === 1 && list[0].source === 'google'
    if (googleOnly) {
      window.open(googleFamilyPage(list[0].family), '_blank', 'noopener')
      return
    }
    try {
      const { skipped } = await downloadFonts(identity.name, list)
      if (skipped > 0) showShareTip('download-skipped')
    } catch (error) {
      console.error('Could not download', error)
    }
  }

  function handleFontAction(action, font) {
    setMenuLogoId(null)
    if (action === 'download') downloadFontsOf([font])
    else if (action === 'delete') setDeleteTarget([font.id])
    // "Editar": no action yet.
  }

  // "Editar" has no action yet. "Copiar hex" copies the main hex and shows "Copiado".
  async function handleColorAction(action, color) {
    setMenuLogoId(null)
    if (action === 'delete') setDeleteTarget([color.id])
    else if (action === 'edit') setViewerId(color.id)
    else if (action === 'copy') {
      try {
        await navigator.clipboard.writeText(color.hex)
      } catch (error) {
        console.error('Could not copy', error)
      }
      showShareTip(`copy:${color.id}`)
    }
  }

  function handleCardAction(action, logo) {
    setMenuLogoId(null)
    if (action === 'download') handleDownload([logo.id])
    else if (action === 'share') showShareTip(logo.id)
    else if (action === 'delete') setDeleteTarget([logo.id])
    else if (action === 'edit') setViewerId(logo.id)
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const nextViewer = (() => {
        if (!viewerId || !deleteTarget.includes(viewerId)) return undefined
        const at = visibleCards.findIndex((card) => card.id === viewerId)
        const rest = visibleCards.filter((card) => !deleteTarget.includes(card.id))
        const following = visibleCards.slice(at + 1).find((card) => rest.includes(card))
        const before = visibleCards.slice(0, at).reverse().find((card) => rest.includes(card))
        return following ? following.id : before ? before.id : null
      })()
      await deleteLogos(
        identity.id,
        deleteTarget,
        isPalette ? 'paleta' : isTypo ? 'tipografia' : kind.key,
      )
      if (nextViewer !== undefined) setViewerId(nextViewer)
      setSelectedIds((current) => current.filter((item) => !deleteTarget.includes(item)))
      setDeleteTarget(null)
    } catch (error) {
      console.error('Could not delete', error)
      setDeleteError('Não foi possível excluir')
    } finally {
      setDeleting(false)
    }
  }

  function closeSearch() {
    setQuery('')
    setSearchOpen(false)
  }

  return (
    <div className="folder-page" data-visible-items={visibleItems.length}>
      <PageContainer>
        <div className="detail-top">
          <Breadcrumb name={identity.name} to={`/id/${identity.id}`} current={folder.title} />
          <ManualLink identityId={identity.id} />
        </div>
      </PageContainer>

      <div className="folder-divider" />

      <PageContainer>
        <div className="toolbar">
          {selectedIds.length > 0 ? (
            <SelectionBar
              count={selectedIds.length}
              onlyDelete={isPalette}
              hideShare={isTypo}
              downloadTip={isTypo && shareTip === 'download-skipped' ? 'Fontes do Google não incluídas' : null}
              shareTip={shareTip === 'toolbar'}
              onClear={() => setSelectedIds([])}
              onDelete={() => setDeleteTarget(selectedIds)}
              onDownload={() =>
                isTypo
                  ? downloadFontsOf(fonts.filter((font) => selectedIds.includes(font.id)))
                  : handleDownload(selectedIds)
              }
              onShare={() => showShareTip('toolbar')}
            />
          ) : (
            <p className="toolbar__total">
              Total: {total} {total === 1 ? 'item' : 'itens'} em {folder.title}
            </p>
          )}
          <div className="toolbar__actions">
            <ExpandableSearch
              open={searchOpen}
              onOpen={() => setSearchOpen(true)}
              onClose={closeSearch}
              query={query}
              onQueryChange={setQuery}
              placeholder={`Buscar em ${folder.title}`}
              escapeEnabled={!upload && !deleteTarget && !viewerId && !paletteOpen && !generateOpen && !fontModal}
              triggerClassName="toolbar-icon-btn"
              iconSize={24}
            />
            {/* Visual only. */}
            <button type="button" className="filters-btn">
              <span className="filters-btn__label">Filtros</span>
              <SlidersHorizontal size={24} color="#798282" weight="regular" />
            </button>
          </div>
        </div>

        {folder.cards.length > 0 || visibleCards.length > 0 ? (
          <div className="add-grid">
            {folder.cards.map((card) => (
              <AddCard
                key={card.id}
                icon={card.icon}
                label={card.label}
                disabled={
                  (card.isEnabled ? !card.isEnabled(identity) : false) ||
                  (card.action === 'generate-palette' && pending.length > 0)
                }
                disabledStyle={card.disabledStyle}
                onClick={
                  card.action === 'upload-asset'
                    ? () => (kind.hasType ? setChooser('logo') : handleUpload())
                    : card.action === 'create-palette'
                      ? () => setPaletteOpen(true)
                      : card.action === 'generate-palette'
                        ? () => setGenerateOpen(true)
                      : card.action === 'upload-font'
                        ? () => setChooser('font-upload')
                        : card.action === 'google-font'
                          ? () => setChooser('font-google')
                          : undefined
                }
              />
            ))}
            {visibleFonts.map((font) => (
              <FontCard
                key={font.id}
                font={font}
                selected={selectedIds.includes(font.id)}
                selecting={selectedIds.length > 0}
                menuOpen={menuLogoId === font.id}
                onToggleSelect={toggleSelect}
                onOpenMenu={setMenuLogoId}
                onCloseMenu={closeMenu}
                onAction={handleFontAction}
              />
            ))}
            {gridColors.map((entry) =>
              entry.pending ? (
                <GeneratingCard key={entry.pending.id} category={entry.pending.category} />
              ) : (
              <ColorCard
                key={entry.color.id}
                color={entry.color}
                selected={selectedIds.includes(entry.color.id)}
                selecting={selectedIds.length > 0}
                menuOpen={menuLogoId === entry.color.id}
                copiedTip={shareTip === `copy:${entry.color.id}`}
                onToggleSelect={toggleSelect}
                onOpenMenu={setMenuLogoId}
                onCloseMenu={closeMenu}
                onAction={handleColorAction}
                onOpen={setViewerId}
              />
              ),
            )}
            {(isPalette || isTypo ? [] : visibleLogos).map((logo) => (
              <LogoCard
                key={logo.id}
                logo={logo}
                label={kind.label(logo)}
                icon={!kind.hasType}
                element={Boolean(kind.anyFile)}
                selected={selectedIds.includes(logo.id)}
                selecting={selectedIds.length > 0}
                menuOpen={menuLogoId === logo.id}
                shareTip={shareTip === logo.id}
                onToggleSelect={toggleSelect}
                onOpenMenu={setMenuLogoId}
                onCloseMenu={closeMenu}
                onAction={handleCardAction}
                onOpen={setViewerId}
              />
            ))}
          </div>
        ) : null}
        {uploadError ? (
          <p className="add-error" role="alert">
            {uploadError}
          </p>
        ) : null}
      </PageContainer>

      {viewerId && isPalette ? (
        <ColorViewer
          colors={visibleColors}
          colorId={viewerId}
          deleteOpen={Boolean(deleteTarget)}
          onChangeColor={setViewerId}
          onClose={() => setViewerId(null)}
          onDelete={(color) => setDeleteTarget([color.id])}
          categoryTextOf={(category) => categoryText(identity, category)}
          onUpdate={(colorId, changes, text) => updatePaletteColor(identity.id, colorId, changes, text)}
        />
      ) : null}

      {viewerId && !isPalette ? (
        <LogoViewer
          identity={identity}
          logos={visibleLogos}
          logoId={viewerId}
          kind={kind}
          deleteOpen={Boolean(deleteTarget)}
          shareTip={shareTip === 'viewer'}
          onChangeLogo={setViewerId}
          onClose={() => setViewerId(null)}
          onDelete={(logo) => setDeleteTarget([logo.id])}
          onShare={() => showShareTip('viewer')}
          onUpdate={(logoId, changes, rights) =>
            updateLogo(identity.id, logoId, changes, rights, kind.key)
          }
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title={
            isPalette
              ? deleteTarget.length === 1
                ? 'Excluir cor?'
                : `Excluir ${deleteTarget.length} cores?`
              : isTypo
                ? deleteTarget.length === 1
                  ? 'Excluir tipografia?'
                  : `Excluir ${deleteTarget.length} tipografias?`
                : kind.deleteTitle(deleteTarget.length)
          }
          text="Essa ação não pode ser desfeita."
          cancelLabel="Cancelar"
          confirmLabel="Excluir"
          error={deleteError}
          busy={deleting}
          onCancel={() => {
            setDeleteTarget(null)
            setDeleteError(null)
          }}
          onConfirm={confirmDelete}
        />
      ) : null}

      {chooser === 'logo' ? (
        <TypeChooserModal
          title="Adicione uma logo"
          options={LOGO_TYPES}
          usedTypes={usedLogoTypes(identity.logos)}
          rows={[2, 3]}
          onClose={() => setChooser(null)}
          onPick={(type) => {
            setChooser(null)
            handleUpload(type)
          }}
        />
      ) : null}

      {chooser === 'font-upload' || chooser === 'font-google' ? (
        <TypeChooserModal
          title={chooser === 'font-upload' ? 'Adicionar uma tipografia' : 'Selecionar uma tipografia'}
          options={FONT_TYPES}
          usedTypes={usedFontTypes(identity.tipografia)}
          rows={[3]}
          onClose={() => setChooser(null)}
          onPick={(type) => {
            const source = chooser
            setChooser(null)
            if (source === 'font-upload') handleFontUpload(type)
            else setFontModal({ mode: 'google', type })
          }}
        />
      ) : null}

      {fontModal ? (
        <NewFontModal
          identity={identity}
          mode={fontModal.mode}
          initialFont={fontModal.font}
          initialType={fontModal.type}
          onClose={() => setFontModal(null)}
          onSave={(font, createdRights) => addLogo(identity.id, font, createdRights, 'tipografia')}
        />
      ) : null}

      {generateOpen ? (
        <GeneratePaletteModal
          identity={identity}
          onClose={() => setGenerateOpen(false)}
          onCreate={handleGenerate}
        />
      ) : null}

      {paletteOpen ? (
        <NewPaletteModal
          identity={identity}
          onClose={() => setPaletteOpen(false)}
          onSave={(items) => addItems(identity.id, items, 'paleta')}
        />
      ) : null}

      {upload ? (
        <NewLogoModal
          identity={identity}
          upload={upload}
          kind={kind}
          onClose={() => setUpload(null)}
          onSave={(logo, createdRights) => addLogo(identity.id, logo, createdRights, kind.key)}
        />
      ) : null}
    </div>
  )
}
