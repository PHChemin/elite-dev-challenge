import {
  AppShell,
  Burger,
  Button,
  Container,
  Drawer,
  Group,
  Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { mdiClose, mdiLogin, mdiLogout } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { AppFooter } from '@/components/Shared/AppFooter';
import { AppNavLink } from '@/components/Shared/AppNavLink';
import { BrandLogo } from '@/components/Shared/BrandLogo';
import { AppBadge } from '@/components/UI/AppBadge';
import { AppIcon } from '@/components/UI/AppIcon';
import { homeForRole, ROUTES } from '@/routes/routes';

const HEADER_HEIGHT = 84;
const FOOTER_HEIGHT = 52;

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpened, { toggle, close }] = useDisclosure(false);
  const home = user ? homeForRole(user.role) : ROUTES.exhibitions;

  function handleLogout() {
    close();
    logout();
    void navigate(ROUTES.exhibitions);
  }

  function navLinks(stacked = false) {
    if (user?.role === 'organizer') {
      return (
        <AppNavLink
          to={ROUTES.organizerExhibitions}
          stacked={stacked}
          onClick={close}
        >
          {t('nav.myExhibitions')}
        </AppNavLink>
      );
    }

    return (
      <AppNavLink to={ROUTES.exhibitions} stacked={stacked} onClick={close}>
        {t('nav.exhibitions')}
      </AppNavLink>
    );
  }

  const authActions = user ? (
    <>
      <AppBadge color="brand" visibleFrom="sm">
        {t(`common.roles.${user.role}`, { defaultValue: user.role })}
      </AppBadge>
      <Button
        variant="subtle"
        size="compact-sm"
        leftSection={<AppIcon path={mdiLogout} />}
        onClick={handleLogout}
      >
        {t('common.logout')}
      </Button>
    </>
  ) : (
    <Button
      component={Link}
      to={ROUTES.login}
      size="compact-sm"
      leftSection={<AppIcon path={mdiLogin} />}
      onClick={close}
    >
      {t('nav.login')}
    </Button>
  );

  return (
    <AppShell
      header={{ height: HEADER_HEIGHT }}
      footer={{ height: FOOTER_HEIGHT }}
      padding={0}
    >
      <AppShell.Header bg="white">
        <Container fluid h="100%" px={{ base: 'sm', sm: 'md', lg: 'lg' }}>
          <Group h="100%" justify="space-between" wrap="nowrap" gap="md">
            <Group gap="lg" wrap="nowrap">
              <Burger
                opened={menuOpened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
                color="black"
                aria-label={t('nav.menu')}
              />
              <Link to={home} aria-label={t('nav.home')}>
                <BrandLogo minRem={6.5} maxRem={9} vw={18} />
              </Link>
              <Group gap="lg" wrap="nowrap" visibleFrom="sm">
                {navLinks()}
              </Group>
            </Group>

            <Group gap="sm" wrap="nowrap" visibleFrom="sm">
              {authActions}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <Drawer
        opened={menuOpened}
        onClose={close}
        hiddenFrom="sm"
        position="left"
        size="xs"
        title={<BrandLogo minRem={6} maxRem={7} vw={40} />}
        closeButtonProps={{
          icon: <AppIcon path={mdiClose} />,
          'aria-label': t('nav.closeMenu'),
        }}
      >
        <Stack gap="lg" mt="md">
          <Stack gap="sm">{navLinks(true)}</Stack>
          <Stack gap="sm">
            {user ? (
              <>
                <AppBadge color="brand" w="fit-content">
                  {t(`common.roles.${user.role}`, { defaultValue: user.role })}
                </AppBadge>
                <Button
                  variant="subtle"
                  justify="flex-start"
                  leftSection={<AppIcon path={mdiLogout} />}
                  onClick={handleLogout}
                >
                  {t('common.logout')}
                </Button>
              </>
            ) : (
              <Button
                component={Link}
                to={ROUTES.login}
                justify="flex-start"
                leftSection={<AppIcon path={mdiLogin} />}
                onClick={close}
              >
                {t('nav.login')}
              </Button>
            )}
          </Stack>
        </Stack>
      </Drawer>

      <AppShell.Main>
        <Container
          fluid
          maw={1680}
          px={{ base: 'md', sm: 'lg', md: 40, lg: 56 }}
          py={{ base: 'md', sm: 'xl' }}
        >
          <Outlet />
        </Container>
      </AppShell.Main>

      <AppShell.Footer bg="white">
        <AppFooter />
      </AppShell.Footer>
    </AppShell>
  );
}
