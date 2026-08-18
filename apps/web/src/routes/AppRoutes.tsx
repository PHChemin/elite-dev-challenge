import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/Shared/AppLayout';
import { LoginPage } from '@/pages/auth/login/LoginPage';
import { ExhibitionDetailPage } from '@/pages/exhibitions/detail/ExhibitionDetailPage';
import { ExhibitionsListPage } from '@/pages/exhibitions/list/ExhibitionsListPage';
import { CreateEventsPage } from '@/pages/organizer/events/create/CreateEventsPage';
import { EventFormPage } from '@/pages/organizer/events/edit/EventFormPage';
import { ExhibitionFormPage } from '@/pages/organizer/exhibitions/create/ExhibitionFormPage';
import { OrganizerExhibitionPage } from '@/pages/organizer/exhibitions/detail/OrganizerExhibitionPage';
import { OrganizerExhibitionsPage } from '@/pages/organizer/exhibitions/list/OrganizerExhibitionsPage';
import { RequireRole } from './RequireRole';
import { ROUTES } from './routes';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path={ROUTES.exhibitions} element={<ExhibitionsListPage />} />
        <Route
          path={ROUTES.exhibitionDetail}
          element={<ExhibitionDetailPage />}
        />
        <Route
          path={ROUTES.organizerExhibitions}
          element={
            <RequireRole roles={['organizer']}>
              <OrganizerExhibitionsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.organizerExhibitionNew}
          element={
            <RequireRole roles={['organizer']}>
              <ExhibitionFormPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.organizerExhibitionDetail}
          element={
            <RequireRole roles={['organizer']}>
              <OrganizerExhibitionPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.organizerEventsNew}
          element={
            <RequireRole roles={['organizer']}>
              <CreateEventsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.organizerEventEdit}
          element={
            <RequireRole roles={['organizer']}>
              <EventFormPage />
            </RequireRole>
          }
        />
        <Route
          path="*"
          element={<Navigate to={ROUTES.exhibitions} replace />}
        />
      </Route>
    </Routes>
  );
}
