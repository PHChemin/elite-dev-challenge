import {
  Button,
  Center,
  Group,
  PasswordInput,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { mdiClose, mdiLogin } from '@mdi/js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { BrandLogo } from '@/components/Shared/BrandLogo';
import { AppIcon } from '@/components/UI/AppIcon';
import { PageTitle } from '@/components/UI/PageTitle';
import { homeForRole, ROUTES } from '@/routes/routes';
import { AuthCard } from '../_AuthCard';

type LoginLocationState = {
  from?: { pathname: string; search?: string };
} | null;

export function LoginPage() {
  const { t } = useTranslation();
  const { login, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value) ? null : t('validation.email.invalid'),
      password: (value) =>
        value.length > 0 ? null : t('validation.password.required'),
    },
  });

  if (user) {
    const from = (location.state as LoginLocationState)?.from;
    const target = from
      ? `${from.pathname}${from.search ?? ''}`
      : homeForRole(user.role);
    return <Navigate to={target} replace />;
  }

  return (
    <Center
      mih="100vh"
      px={{ base: 'sm', sm: 'md' }}
      py={{ base: 'sm', sm: 'md' }}
    >
      <AuthCard>
        <form
          onSubmit={form.onSubmit(async (values) => {
            setSubmitting(true);
            try {
              await login(values.email, values.password);
            } catch (error) {
              if (error instanceof ApiError) {
                const emailError = error.fieldErrors.email?.[0];
                const passwordError = error.fieldErrors.password?.[0];
                if (emailError || passwordError) {
                  form.setErrors({
                    ...(emailError ? { email: emailError } : {}),
                    ...(passwordError ? { password: passwordError } : {}),
                  });
                } else {
                  notifications.show({
                    title: t('auth.login.failed'),
                    message: error.message,
                    color: 'brand.4',
                  });
                }
              } else {
                notifications.show({
                  title: t('auth.login.failed'),
                  message: t('auth.login.failedRetry'),
                  color: 'brand.4',
                });
              }
            } finally {
              setSubmitting(false);
            }
          })}
        >
          <Stack gap="md">
            <Stack align="center" gap="sm">
              <BrandLogo />
              <PageTitle>{t('auth.login.title')}</PageTitle>
            </Stack>
            <TextInput
              label={t('common.email')}
              placeholder={t('common.emailPlaceholder')}
              autoComplete="email"
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label={t('common.password')}
              placeholder={t('common.passwordPlaceholder')}
              autoComplete="current-password"
              {...form.getInputProps('password')}
            />
            <Group grow>
              <Button
                type="button"
                variant="subtle"
                leftSection={<AppIcon path={mdiClose} />}
                onClick={() => void navigate(ROUTES.exhibitions)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                loading={submitting}
                leftSection={<AppIcon path={mdiLogin} />}
              >
                {t('common.submit')}
              </Button>
            </Group>
          </Stack>
        </form>
      </AuthCard>
    </Center>
  );
}
