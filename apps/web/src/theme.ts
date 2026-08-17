import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  headings: { fontFamily: 'Roboto, sans-serif' },
  primaryColor: 'brand',
  colors: {
    brand: [
      '#F5F3F4',
      '#E8D0D1',
      '#D4A3A4',
      '#C07072',
      '#BA181B',
      '#8E0F12',
      '#660708',
      '#4C0506',
      '#330304',
      '#1A0102',
    ],
    success: [
      '#E8F5EE',
      '#CDE7D9',
      '#A3D4BB',
      '#75BE99',
      '#4FA67A',
      '#2D6A4F',
      '#245740',
      '#1B4332',
      '#122E23',
      '#091A14',
    ],
  },
  defaultRadius: 'sm',
  black: '#161A1D',
  white: '#F5F3F4',
});
