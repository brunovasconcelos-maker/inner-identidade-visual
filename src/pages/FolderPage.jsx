import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Desktop, SlidersHorizontal } from '@phosphor-icons/react'
import PageContainer from '../components/PageContainer.jsx'
import Breadcrumb from '../components/Breadcrumb.jsx'
import ExpandableSearch from '../components/ExpandableSearch.jsx'
import AddCard from '../components/AddCard.jsx'
import NewLogoModal from '../components/logo/NewLogoModal.jsx'
import { useIdentities } from '../data/identities.jsx'
import { findFolder } from '../data/folders.jsx'
import { normalize } from '../utils/format.js'
import { openFilePicker, readImageSize, validateImageFile } from '../utils/files.js'

export default function FolderPage() {
  const { id, section } = useParams()
  const { identities, loading, addLogo } = useIdentities()
  const identity = identities.find((item) => item.id === id)
  const folder = findFolder(section)

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [upload, setUpload] = useState(null) // file chosen for the "Nova logo" modal
  const [uploadError, setUploadError] = useState(null)

  const items = identity && folder ? identity[folder.key] : []
  // Items of this folder that match the search. Nothing renders them yet, but the
  // filter is in place for when items exist. The add cards are never filtered.
  const visibleItems = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return items
    return items.filter((item) => normalize(item.name || '').includes(term))
  }, [items, query])

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
  async function handleUploadLogo() {
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
          <p className="toolbar__total">
            Total: {total} {total === 1 ? 'item' : 'itens'} em {folder.title}
          </p>
          <div className="toolbar__actions">
            <ExpandableSearch
              open={searchOpen}
              onOpen={() => setSearchOpen(true)}
              onClose={closeSearch}
              query={query}
              onQueryChange={setQuery}
              placeholder={`Buscar em ${folder.title}`}
              escapeEnabled={!upload}
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

        {folder.cards.length > 0 ? (
          <div className="add-grid">
            {folder.cards.map((card) => (
              <AddCard
                key={card.id}
                icon={card.icon}
                label={card.label}
                disabled={card.isEnabled ? !card.isEnabled(identity) : false}
                onClick={card.action === 'upload-logo' ? handleUploadLogo : undefined}
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

      {upload ? (
        <NewLogoModal
          identity={identity}
          upload={upload}
          onClose={() => setUpload(null)}
          onSave={(logo, createdRights) => addLogo(identity.id, logo, createdRights)}
        />
      ) : null}
    </div>
  )
}
