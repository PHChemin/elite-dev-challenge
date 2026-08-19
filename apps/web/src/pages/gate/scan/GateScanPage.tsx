import {
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { listGateEvents, scanTicket } from '@/api/gate';
import type { GateScanResult, GateScanStatus } from '@/api/types';
import { PageTitle } from '@/components/UI/PageTitle';
import { ROUTES } from '@/routes/routes';
import { formatDateTime } from '@/utils/format';
import { ScanResult } from '../_ScanResult';

const SCANNER_ID = 'gate-qr-reader';

export function GateScanPage() {
  const { t } = useTranslation();
  const { eventId = '' } = useParams();
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<GateScanResult | null>(null);
  const [sessionLabel, setSessionLabel] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let active = true;
    void listGateEvents({ page: 1, pageSize: 50 }).then((page) => {
      if (!active) {
        return;
      }
      const event = page.items.find((row) => row.id === eventId);
      if (event) {
        setSessionLabel(
          `${event.exhibition.title} · ${formatDateTime(event.startsAt)} · ${event.venueName}`,
        );
      }
    });
    return () => {
      active = false;
    };
  }, [eventId]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      return;
    }
    try {
      await scanner.stop();
    } catch {
      // camera may already be stopped
    }
    try {
      scanner.clear();
    } catch {
      // ignore cleanup errors
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  async function submitCode(code: string) {
    const trimmed = code.trim();
    if (!trimmed || !eventId || busyRef.current) {
      return;
    }
    busyRef.current = true;
    try {
      const result = await scanTicket({ eventId, code: trimmed });
      setScanResult(result);
    } finally {
      busyRef.current = false;
    }
  }

  async function startScanner() {
    if (scanning) {
      await stopScanner();
      return;
    }
    setScanResult(null);
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;
    setScanning(true);
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 8, qrbox: { width: 240, height: 240 } },
      (decoded) => {
        void submitCode(decoded);
      },
      () => undefined,
    );
  }

  function clearResult() {
    setScanResult(null);
    setManualCode('');
  }

  const activeStatus: GateScanStatus | null = scanResult?.status ?? null;

  return (
    <Stack gap="xl">
      <PageTitle ta="left">{t('gate.scan.title')}</PageTitle>
      <Text c="dimmed">{sessionLabel || t('gate.scan.loadingSession')}</Text>
      <Button component={Link} to={ROUTES.gateSessions} variant="subtle" w="fit-content">
        {t('gate.scan.changeSession')}
      </Button>

      {activeStatus ? (
        <Stack gap="md">
          <ScanResult status={activeStatus} seatLabel={scanResult?.seatLabel} />
          <Button onClick={clearResult}>{t('gate.scan.next')}</Button>
        </Stack>
      ) : (
        <Stack gap="lg">
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Title order={3} fz="h4">
                {t('gate.scan.camera')}
              </Title>
              <div id={SCANNER_ID} style={{ width: '100%', minHeight: scanning ? 280 : 0 }} />
              <Button onClick={() => void startScanner()}>
                {scanning ? t('gate.scan.stopCamera') : t('gate.scan.startCamera')}
              </Button>
            </Stack>
          </Paper>

          <Paper p="md" withBorder>
            <Stack gap="md">
              <Title order={3} fz="h4">
                {t('gate.scan.manual')}
              </Title>
              <TextInput
                label={t('gate.scan.codeLabel')}
                value={manualCode}
                onChange={(event) => setManualCode(event.currentTarget.value)}
                placeholder={t('gate.scan.codePlaceholder')}
              />
              <Group>
                <Button onClick={() => void submitCode(manualCode)}>
                  {t('gate.scan.validate')}
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      )}
    </Stack>
  );
}
