import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from '@phosphor-icons/react'
import PageContainer from '../components/PageContainer.jsx'
import EmptyState from '../components/EmptyState.jsx'
import IdentityCard from '../components/IdentityCard.jsx'
import NewIdentityModal from '../components/NewIdentityModal.jsx'
import ExpandableSearch from '../components/ExpandableSearch.jsx'
import { useIdentities } from '../data/identities.jsx'
import { normalize } from '../utils/format.js'

export default function Identities() {
  const navigate = useNavigate()
  const { identities, loading, createIdentity } = useIdentities()
  const [modalOpen, setModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const closeModal = useCallback(() => setModalOpen(false), [])

  function handleCreate(name) {
    const identity = createIdentity(name)
    setModalOpen(false)
    navigate(`/id/${identity.id}`)
  }

  const closeSearch = useCallback(() => {
    setQuery('')
    setSearchOpen(false)
  }, [])

  const visible = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return identities
    return identities.filter((identity) => normalize(identity.name).includes(term))
  }, [identities, query])

  const hasIdentities = identities.length > 0

  if (loading) return null

  return (
    <PageContainer>
      <h1 className="page-title">Identidade visual</h1>

      <div className="section-row">
        <h2 className="section-row__title">Minhas identidades visuais</h2>
        <div className="section-row__actions">
          <ExpandableSearch
            open={searchOpen}
            onOpen={() => setSearchOpen(true)}
            onClose={closeSearch}
            query={query}
            onQueryChange={setQuery}
            placeholder="Buscar identidade"
            escapeEnabled={!modalOpen}
          />
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
