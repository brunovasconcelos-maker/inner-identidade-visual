import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Desktop, SlidersHorizontal } from '@phosphor-icons/react'
import PageContainer from '../components/PageContainer.jsx'
import Breadcrumb from '../components/Breadcrumb.jsx'
import ExpandableSearch from '../components/ExpandableSearch.jsx'
import AddCard from '../components/AddCard.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LogoViewer from '../components/logo/LogoViewer.jsx'
import LogoCard from '../components/logo/LogoCard.jsx'
import ColorCard from '../components/palette/ColorCard.jsx'
import NewPaletteModal from '../components/palette/NewPaletteModal.jsx'
import NewLogoModal from '../components/logo/NewLogoModal.jsx'
import SelectionBar from '../components/logo/SelectionBar.jsx'
import { useIdentities } from '../data/identities.jsx'
import { findFolder } from '../data/folders.jsx'
import { kindForSection } from '../data/assetKinds.js'
import { sortLogos } from '../data/logoTypes.js'
import { CATEGORIES, sortColors } from '../data/palette.js'
import { normalize } from '../utils/format.js'
import { openFilePicker, readImageSize, validateImageFile } from '../utils/files.js'
import { downloadLogos } from '../utils/download.js'

// The search filters logo cards by type name and tags (case and accent insensitive).
function logoMatches(logo, label, term) {
  return (
    normalize(label).includes(term) ||
    logo.tags.some((tag) => normalize(tag).includes(term))
  )
}

export default function FolderPage() {
  const { id, section } = useParams()
  const { identities, loading, addLogo, addItems, updateLogo, deleteLogos } = useIdentities()
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
  const shareTimer = useRef(null)

  // Logo and Ícone share the whole flow (cards, upload modal, viewer, actions).
  const kind = kindForSection(section)
  const isPalette = section === 'paleta-de-cores'
  const items = identity && folder ? identity[folder.key] : []
  const logos = useMemo(() => {
    if (!kind || !identity) return []
    return kind.hasType ? sortLogos(identity[kind.key]) : identity[kind.key]
  }, [kind, identity])
  const visibleLogos = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return logos
    return logos.filter((logo) => logoMatches(logo, kind.label(logo), term))
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
  const visibleCards = isPalette ? visibleColors : visibleLogos

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
      if (upload || searchOpen || viewerId || paletteOpen) return
      if (selectedIds.length > 0) setSelectedIds([])
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [deleteTarget, deleting, upload, searchOpen, selectedIds, viewerId, paletteOpen])

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

  // Opens the native file picker. A valid file opens the "Nova logo" modal; an
  // invalid one shows a short message near the card and the modal stays closed.
  async function handleUpload() {
    setUploadError(null)
    const file = await openFilePicker()
    if (!file) return
    const result = validateImageFile(file)
    if (!result.ok) {
      setUploadError(result.error)
      return
    }
    const size = await readImageSize(file)
    setUpload({ file, format: result.format, ...size })
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

  // "Editar" has no action yet. "Copiar hex" copies the main hex and shows "Copiado".
  async function handleColorAction(action, color) {
    setMenuLogoId(null)
    if (action === 'delete') setDeleteTarget([color.id])
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
        const at = visibleLogos.findIndex((logo) => logo.id === viewerId)
        const rest = visibleLogos.filter((logo) => !deleteTarget.includes(logo.id))
        const following = visibleLogos.slice(at + 1).find((logo) => rest.includes(logo))
        const before = visibleLogos.slice(0, at).reverse().find((logo) => rest.includes(logo))
        return following ? following.id : before ? before.id : null
      })()
      await deleteLogos(identity.id, deleteTarget, isPalette ? 'paleta' : kind.key)
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
          {/* Visual only, no action. */}
          <button type="button" className="btn btn--outline btn--with-icon btn--manual">
            <span className="btn__label">Ver meu manual</span>
            <Desktop size={20} weight="regular" />
          </button>
        </div>
      </PageContainer>

      <div className="folder-divider" />

      <PageContainer>
        <div className="toolbar">
          {selectedIds.length > 0 ? (
            <SelectionBar
              count={selectedIds.length}
              onlyDelete={isPalette}
              shareTip={shareTip === 'toolbar'}
              onClear={() => setSelectedIds([])}
              onDelete={() => setDeleteTarget(selectedIds)}
              onDownload={() => handleDownload(selectedIds)}
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
              escapeEnabled={!upload && !deleteTarget && !viewerId && !paletteOpen}
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
                disabled={card.isEnabled ? !card.isEnabled(identity) : false}
                disabledStyle={card.disabledStyle}
                onClick={
                  card.action === 'upload-asset'
                    ? handleUpload
                    : card.action === 'create-palette'
                      ? () => setPaletteOpen(true)
                      : undefined
                }
              />
            ))}
            {visibleColors.map((color) => (
              <ColorCard
                key={color.id}
                color={color}
                selected={selectedIds.includes(color.id)}
                selecting={selectedIds.length > 0}
                menuOpen={menuLogoId === color.id}
                copiedTip={shareTip === `copy:${color.id}`}
                onToggleSelect={toggleSelect}
                onOpenMenu={setMenuLogoId}
                onCloseMenu={closeMenu}
                onAction={handleColorAction}
              />
            ))}
            {(isPalette ? [] : visibleLogos).map((logo) => (
              <LogoCard
                key={logo.id}
                logo={logo}
                label={kind.label(logo)}
                icon={!kind.hasType}
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

      {viewerId ? (
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
