import {
  GraduationCap,
  House,
  FolderSimple,
  Image as ImageIcon,
  PaintBrush,
  Question,
  SidebarSimple,
  SquaresFour,
  Ticket,
  VideoCamera,
} from '@phosphor-icons/react'

const GRAY = '#5d5d5d'

// Visual only. Only "ID visual" shows the selected state.
export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__toggle">
        <SidebarSimple size={21} color={GRAY} weight="regular" />
      </div>

      <div className="sidebar__item">
        <div className="sidebar__icon">
          <House size={20} color={GRAY} weight="regular" />
        </div>
        <span className="sidebar__label">Início</span>
      </div>
      <div className="sidebar__item">
        <div className="sidebar__icon">
          <FolderSimple size={21} color={GRAY} weight="regular" />
        </div>
        <span className="sidebar__label">Projetos</span>
      </div>
      <div className="sidebar__item" aria-current="page">
        <div className="sidebar__icon sidebar__icon--selected">
          <PaintBrush size={18} color={GRAY} weight="fill" />
        </div>
        <span className="sidebar__label sidebar__label--selected">ID visual</span>
      </div>

      <div className="sidebar__divider-space" />
      <div className="sidebar__divider" />
      <div className="sidebar__divider-space" />

      <div className="sidebar__item">
        <div className="sidebar__icon">
          <ImageIcon size={22} color={GRAY} weight="regular" />
        </div>
        <span className="sidebar__label">Imagens</span>
      </div>
      <div className="sidebar__item">
        <div className="sidebar__icon">
          <VideoCamera size={22} color={GRAY} weight="regular" />
        </div>
        <span className="sidebar__label">Vídeos</span>
      </div>
      <div className="sidebar__item">
        <div className="sidebar__icon">
          <SquaresFour size={22} color={GRAY} weight="regular" />
        </div>
        <span className="sidebar__label">Mais apps</span>
      </div>

      <div className="sidebar__spacer" />

      <div className="sidebar__footer-icon">
        <Ticket size={22} color={GRAY} weight="regular" />
      </div>
      <div className="sidebar__footer-icon">
        <GraduationCap size={22} color={GRAY} weight="regular" />
      </div>
      <div className="sidebar__footer-icon">
        <Question size={22} color={GRAY} weight="regular" />
      </div>
      <div className="sidebar__footer-icon">
        <div className="sidebar__avatar" />
      </div>
    </aside>
  )
}
