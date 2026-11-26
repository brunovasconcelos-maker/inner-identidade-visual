import { Navigate, useParams } from 'react-router-dom'
import { Camera, Smiley, UserSound } from '@phosphor-icons/react'
import ManualLink from '../components/manual/ManualLink.jsx'
import PageContainer from '../components/PageContainer.jsx'
import Breadcrumb from '../components/Breadcrumb.jsx'
import EmptyStateArt from '../components/EmptyStateArt.jsx'
import { useIdentities } from '../data/identities.jsx'
import { findFolder } from '../data/folders.jsx'

// Folders that are not built yet. Each has the icon of its "Outros" menu item, here with the
// size, weight and gray of the empty state illustration (Figma node 6534:20787).
const ICON = { size: 47, color: '#5d5d5d', weight: 'fill' }
export const UNDER_CONSTRUCTION = {
  fotografia: <Camera {...ICON} />,
  'tom-de-voz': <UserSound {...ICON} />,
  personalidade: <Smiley {...ICON} />,
}

export default function FolderUnderConstruction() {
  const { id, section } = useParams()
  const { identities, loading } = useIdentities()
  const identity = identities.find((item) => item.id === id)
  const folder = findFolder(section)

  if (loading) return null
  if (!identity) return <Navigate to="/" replace />
  if (!folder) return <Navigate to={`/id/${id}`} replace />

  return (
    <div className="folder-page">
      <PageContainer>
        <div className="detail-top">
          <Breadcrumb name={identity.name} to={`/id/${identity.id}`} current={folder.title} />
          <ManualLink identityId={identity.id} />
        </div>
      </PageContainer>

      <div className="folder-divider" />

      <div className="empty-state empty-state--folder">
        <EmptyStateArt icon={UNDER_CONSTRUCTION[section]} />
        <div className="empty-state__texts">
          <p className="empty-state__title">Nada a fazer aqui ainda</p>
          <p className="empty-state__subtitle">Essa página está sob construção</p>
        </div>
      </div>
    </div>
  )
}
