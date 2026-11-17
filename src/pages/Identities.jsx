import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Plus, X } from '@phosphor-icons/react'
import PageContainer from '../components/PageContainer.jsx'
import EmptyState from '../components/EmptyState.jsx'
import IdentityCard from '../components/IdentityCard.jsx'
import NewIdentityModal from '../components/NewIdentityModal.jsx'
import { useIdentities } from '../data/identities.jsx'
import { normalize } from '../utils/format.js'

export default function Identities() {
  const navigate = useNavigate()
  const { identities, createIdentity } = useIdentities()
  const [modalOpen, setModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchInputRef = useRef(null)

  const closeModal = useCallback(() => setModalOpen(false), [])

  function handleCreate(name) {
    const identity = createIdentity(name)
    setModalOpen(false)
    navigate(`/id/${identity.id}`)
  }

  function closeSearch() {
    setQuery('')
    setSearchOpen(false)
  }

  useEffect(() => {
    if (!searchOpen || modalOpen) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setQuery('')
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [searchOpen, modalOpen])

  const visible = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return identities
    return identities.filter((identity) => normalize(identity.name).includes(term))
  }, [identities, query])

  const hasIdentities = identities.length > 0

  return (
    <PageContainer>
      <h1 className="page-title">Identidade visual</h1>

      <div className="section-row">
        <h2 className="section-row__title">Minhas identidades visuais</h2>
        <div className="section-row__actions">
          {searchOpen ? (
            <div className="search-field">
              <input
                ref={searchInputRef}
                className="search-field__input"
                type="text"
                value={query}
                placeholder="Buscar identidade"
                autoFocus
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
              <button
                type="button"
                className="search-field__clear"
                aria-label="Limpar busca"
                onClick={closeSearch}
              >
                <X size={16} color="#5d5d5d" weight="regular" />
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="icon-btn"
            aria-label="Buscar identidade"
            onClick={() => setSearchOpen(true)}
          >
            <MagnifyingGlass size={20} color="#5d5d5d" weight="regular" />
          </button>
          <button
            type="button"
            className="btn btn--primary btn--with-icon"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={16} weight="regular" />
            <span className="btn__label">Nova identidade</span>
          </button>
        </div>
      </div>

      {!hasIdentities ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
      ) : visible.length === 0 ? (
        <p className="no-results">Nenhuma identidade encontrada</p>
      ) : (
        <div className="identity-grid">
          {visible.map((identity) => (
            <IdentityCard key={identity.id} identity={identity} />
          ))}
        </div>
      )}

      {modalOpen ? <NewIdentityModal onClose={closeModal} onCreate={handleCreate} /> : null}
    </PageContainer>
  )
}
