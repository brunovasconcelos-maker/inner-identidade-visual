import {
  GRID_CELLS,
  GRID_CELL_SIZE,
  GRID_HEIGHT,
  GRID_WIDTH,
} from '../data/emptyStateGridCells.js'

// Grid background of the empty state, rebuilt in CSS from the Figma node.
export default function EmptyStateGrid() {
  return (
    <div
      className="empty-grid"
      aria-hidden="true"
      style={{ width: GRID_WIDTH, height: GRID_HEIGHT }}
    >
      {GRID_CELLS.map(([col, row, kind]) => (
        <span
          key={`${col}-${row}`}
          className={`empty-grid__cell empty-grid__cell--${kind}`}
          style={{
            left: col * GRID_CELL_SIZE,
            top: row * GRID_CELL_SIZE,
            width: GRID_CELL_SIZE,
            height: GRID_CELL_SIZE,
          }}
        />
      ))}
    </div>
  )
}
