import { Box } from '@mantine/core';

type BrandLogoProps = {
  /** Largura mínima em rem (mobile). Padrão: 7.5 */
  minRem?: number;
  /** Largura máxima em rem (desktop). Padrão: 10.5 */
  maxRem?: number;
  /** Parte fluida da fórmula clamp (vw). Padrão: 28 */
  vw?: number;
};

export function BrandLogo({ minRem = 7.5, maxRem = 10.5, vw = 28 }: BrandLogoProps) {
  const size = `clamp(${minRem}rem, ${vw}vw, ${maxRem}rem)`;

  return (
    <Box
      component="img"
      src="/logo.png"
      alt="PHCTickets"
      w={size}
      mah={size}
      maw="100%"
      style={{ height: 'auto', objectFit: 'contain', display: 'block' }}
    />
  );
}
