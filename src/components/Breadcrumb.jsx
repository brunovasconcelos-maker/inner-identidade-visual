import { useNavigate } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'

// The caret-left and the name navigate to `to`. `current` is the folder name
// shown after the "/" on folder pages.
export default function Breadcrumb({ name, to, current }) {
  const navigate = useNavigate()
  return (
    <div className="breadcrumb">
      <button type="button" className="breadcrumb__back" onClick={() => navigate(to)}>
        <CaretLeft size={20} color="#5d5d5d" weight="regular" />
        <span className="breadcrumb__name">{name}</span>
      </button>
      {current ? (
        <>
          <span className="breadcrumb__text">/</span>
          <span className="breadcrumb__text">{current}</span>
        </>
      ) : null}
    </div>
  )
}
