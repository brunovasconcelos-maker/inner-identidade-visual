import { Navigate, useParams } from 'react-router-dom'
import {
  AppleLogo,
  Desktop,
  Swatches,
  TextT,
  TrademarkRegistered,
  PuzzlePiece,
} from '@phosphor-icons/react'
import PageContainer from '../components/PageContainer.jsx'
import Breadcrumb from '../components/Breadcrumb.jsx'
import FolderCard from '../components/FolderCard.jsx'
import MagoSearch from '../components/MagoSearch.jsx'
import OutrosMenu from '../components/OutrosMenu.jsx'
import { useIdentities } from '../data/identities.jsx'

export default function IdentityDetail() {
  const { id } = useParams()
  const { identities } = useIdentities()
  const identity = identities.find((item) => item.id === id)

  if (!identity) return <Navigate to="/" replace />

  return (
    <PageContainer>
      <div className="detail-top">
        <Breadcrumb name={identity.name} to="/" />
        {/* Visual only, no action. */}
        <button type="button" className="btn btn--outline btn--with-icon btn--manual">
          <span className="btn__label">Ver meu manual</span>
          <Desktop size={20} weight="regular" />
        </button>
      </div>

      <h1 className="detail-title">{identity.name}</h1>

      <div className="folder-row">
        <FolderCard
          icon={<TrademarkRegistered size={24} color="#2acc60" weight="fill" />}
          tint="#eafbf0"
          title="Logo"
          to={`/id/${identity.id}/logo`}
          description="A logo certa em cada peça"
        />
        <FolderCard
          icon={<AppleLogo size={24} color="#5799db" weight="fill" />}
          tint="#eaf2fb"
          title="Ícone"
          to={`/id/${identity.id}/icone`}
          description="Símbolo pronto para qualquer situação"
        />
        <FolderCard
          icon={<Swatches size={24} color="#6257db" weight="fill" />}
          tint="#ebeafb"
          title="Paleta de cores"
          to={`/id/${identity.id}/paleta-de-cores`}
          description="Consistência de cor em cada criação"
        />
        <FolderCard
          icon={<TextT size={24} color="#d6c25c" weight="fill" />}
          tint="#faf7eb"
          title="Tipografia"
          to={`/id/${identity.id}/tipografia`}
          description="Fonte consistente, do título ao rodapé."
        />
        <FolderCard
          icon={<PuzzlePiece size={24} color="#db5799" weight="fill" />}
          tint="#fbeaf2"
          title="Elementos"
          to={`/id/${identity.id}/elementos`}
          description="Seus padrões e ilustrações"
        />
        <OutrosMenu identityId={identity.id} />
      </div>

      <MagoSearch />
    </PageContainer>
  )
}
