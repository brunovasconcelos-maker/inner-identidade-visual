import { Navigate, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer.jsx'
import Breadcrumb from '../components/Breadcrumb.jsx'
import { OUTROS_ITEMS } from '../components/OutrosMenu.jsx'
import { useIdentities } from '../data/identities.jsx'

export default function SectionPlaceholder() {
  const { id, section } = useParams()
  const { identities } = useIdentities()
  const identity = identities.find((item) => item.id === id)
  const item = OUTROS_ITEMS.find((entry) => entry.slug === section)

  if (!identity) return <Navigate to="/" replace />
  if (!item) return <Navigate to={`/id/${id}`} replace />

  return (
    <PageContainer>
      <div className="detail-top">
        <Breadcrumb name={identity.name} to={`/id/${identity.id}`} />
      </div>
      <h1 className="detail-title">{item.label}</h1>
    </PageContainer>
  )
}
