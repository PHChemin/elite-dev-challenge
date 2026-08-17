import { Center, Stack, Text, Title } from '@mantine/core';

export default function App() {
  return (
    <Center mih="100vh" px="md">
      <Stack align="center" gap="md">
        <img src="/logo.png" alt="PHCTickets" width={96} height={96} />
        <Title order={1} c="#660708">
          PHCTickets
        </Title>
        <Text c="#161A1D" ta="center">
          Monorepo no ar. Login, catálogo e o restante do fluxo entram nas próximas issues.
        </Text>
      </Stack>
    </Center>
  );
}
