import { Stack, Text } from '@mantine/core';
import type { SeatMapSeat } from '@/api/types';
import { SeatButton } from './_SeatButton';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
const COLS = 12;
const AISLE_AFTER = new Set([4, 8]);

export function SeatMap({
  seats,
  selected,
  onToggle,
}: {
  seats: SeatMapSeat[];
  selected: string[];
  onToggle: (label: string) => void;
}) {
  const byLabel = new Map(seats.map((seat) => [seat.label, seat]));
  const selectedSet = new Set(selected);

  return (
    <div className="seat-map-scroll">
      <Stack gap="sm" className="seat-map">
        <Text className="seat-screen" fw={700} size="sm">
          TELA
        </Text>
        {ROWS.map((row) => (
          <div key={row} className="seat-map-row">
            <Text w={18} size="sm" fw={700}>
              {row}
            </Text>
            {Array.from({ length: COLS }, (_, index) => {
              const number = index + 1;
              const label = `${row}${number}`;
              const seat = byLabel.get(label);
              return (
                <span
                  key={label}
                  className={AISLE_AFTER.has(number) ? 'seat-aisle' : undefined}
                >
                  {seat ? (
                    <SeatButton
                      label={label}
                      occupancy={seat.status}
                      selected={selectedSet.has(label)}
                      onToggle={onToggle}
                    />
                  ) : (
                    <span className="seat-btn seat-btn--missing" />
                  )}
                </span>
              );
            })}
            <Text w={18} size="sm" fw={700}>
              {row}
            </Text>
          </div>
        ))}
      </Stack>
    </div>
  );
}
