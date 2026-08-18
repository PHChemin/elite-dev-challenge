import { NumberInput, type NumberInputProps } from '@mantine/core';
import { useState } from 'react';

type MoneyInputProps = Omit<
  NumberInputProps,
  'decimalScale' | 'decimalSeparator' | 'thousandSeparator' | 'prefix'
>;

/**
 * Enquanto o campo está focado, não força ",00". Assim o valor 30 não vira
 * 3000 na máscara. Os centavos entram no blur.
 */
export function MoneyInput({ onFocus, onBlur, ...props }: MoneyInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <NumberInput
      prefix="R$ "
      decimalScale={2}
      fixedDecimalScale={!focused}
      decimalSeparator=","
      thousandSeparator="."
      min={0}
      allowNegative={false}
      hideControls
      {...props}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
    />
  );
}
