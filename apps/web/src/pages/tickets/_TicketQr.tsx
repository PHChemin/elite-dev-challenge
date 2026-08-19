import { QRCodeSVG } from 'qrcode.react';

type TicketQrProps = {
  code: string;
  size?: number;
};

export function TicketQr({ code, size = 220 }: TicketQrProps) {
  return (
    <QRCodeSVG
      value={code}
      size={size}
      bgColor="#ffffff"
      fgColor="#161A1D"
      level="M"
      includeMargin
    />
  );
}
