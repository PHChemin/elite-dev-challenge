import { UnstyledButton } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { dayAndMonth, isToday, weekdayShort, type EventDay } from '@/utils/format';

type EventDayStripProps = {
  days: EventDay[];
  selected: string;
  onSelect: (key: string) => void;
};

export function EventDayStrip({
  days,
  selected,
  onSelect,
}: EventDayStripProps) {
  const { t } = useTranslation();

  return (
    <div
      className="date-strip"
      role="tablist"
      aria-label={t('exhibitions.detail.daysLabel')}
    >
      {days.map((day) => {
        const active = day.key === selected;
        return (
          <UnstyledButton
            key={day.key}
            type="button"
            role="tab"
            className={
              active
                ? 'date-strip-tile date-strip-tile--active'
                : 'date-strip-tile'
            }
            onClick={() => onSelect(day.key)}
            aria-selected={active}
          >
            <span className="date-strip-weekday">
              {isToday(day.sampleIso)
                ? t('exhibitions.detail.today')
                : weekdayShort(day.sampleIso)}
            </span>
            <span className="date-strip-date">{dayAndMonth(day.sampleIso)}</span>
          </UnstyledButton>
        );
      })}
    </div>
  );
}
