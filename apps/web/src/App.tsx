import { Center } from '@mantine/core';
import { LoginPage } from './pages/auth/login/LoginPage';

export default function App() {
  return (
    <Center mih="100vh" px={{ base: 'sm', sm: 'md' }} py={{ base: 'sm', sm: 'md' }}>
      <LoginPage />
    </Center>
  );
}
