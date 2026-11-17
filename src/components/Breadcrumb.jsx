import { useNavigate } from 'react-router-dom'
import { CaretDown, CaretLeft } from '@phosphor-icons/react'

// The caret-left and the name navigate to `to`. The caret-down is visual only.
export default function Breadcrumb({ name, to }) {
  const navigate = useNavigate()
  return (
    <div className="breadcrumb">
      <button type="button" className="breadcrumb__back" onClick={() => navigate(to)}>
        <CaretLeft size={20} color="#5d5d5d" weight="regular" />
        <span className="breadcrumb__name">{name}</span>
      </button>
      <span className="breadcrumb__caret" aria-hidden="true">
        <CaretDown size={20} color="#5d5d5d" weight="regular" />
      </span>
    </div>
  )
}
