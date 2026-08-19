import type { SeatStatus } from '@/api/types';

type SeatButtonProps = {
  label: string;
  occupancy: SeatStatus;
  selected: boolean;
  onToggle: (label: string) => void;
};

export function SeatButton({
  label,
  occupancy,
  selected,
  onToggle,
}: SeatButtonProps) {
  const taken = occupancy === 'taken';
  const mine = occupancy === 'held_by_me' && !selected;
  const className = [
    'seat-btn',
    taken ? 'seat-btn--taken' : '',
    mine ? 'seat-btn--mine' : '',
    selected ? 'seat-btn--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      disabled={taken || mine}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onToggle(label)}
    >
      {label.replace(/^[A-H]/, '')}
    </button>
  );
}
