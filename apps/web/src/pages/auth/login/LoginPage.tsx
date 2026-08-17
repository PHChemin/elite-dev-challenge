import { Button, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { BrandLogo } from '@/components/Shared/BrandLogo';
import { PageTitle } from '@/components/UI/PageTitle';
import { AuthCard } from '../_AuthCard';

export function LoginPage() {
  const { t } = useTranslation();
  const { login, logout, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value)
          ? null
          : t('validation.email.invalid'),
      password: (value) =>
        value.length > 0 ? null : t('validation.password.required'),
    },
  });

  if (user) {
    return (
      <AuthCard>
        <Stack align="center" gap="md">
          <BrandLogo />
          <PageTitle>{t('auth.login.sessionStarted')}</PageTitle>
          <Text ta="center">{user.email}</Text>
          <Text size="sm" ta="center">
            {t(`common.roles.${user.role}`, { defaultValue: user.role })}
          </Text>
          <Button fullWidth variant="outline" onClick={logout}>
            {t('common.logout')}
          </Button>
        </Stack>
      </AuthCard>
    );
  }

  return (
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
          <Button type="submit" fullWidth loading={submitting}>
            {t('common.submit')}
          </Button>
        </Stack>
      </form>
    </AuthCard>
  );
}
