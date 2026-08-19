import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/Shared/AppLayout';
import { LoginPage } from '@/pages/auth/login/LoginPage';
import { EventDetailPage } from '@/pages/events/detail/EventDetailPage';
import { SeatMapPage } from '@/pages/events/seats/SeatMapPage';
import { ExhibitionDetailPage } from '@/pages/exhibitions/detail/ExhibitionDetailPage';
import { ExhibitionsListPage } from '@/pages/exhibitions/list/ExhibitionsListPage';
import { CreateEventsPage } from '@/pages/organizer/events/create/CreateEventsPage';
import { EventFormPage } from '@/pages/organizer/events/edit/EventFormPage';
import { ExhibitionFormPage } from '@/pages/organizer/exhibitions/create/ExhibitionFormPage';
import { OrganizerExhibitionPage } from '@/pages/organizer/exhibitions/detail/OrganizerExhibitionPage';
import { OrganizerExhibitionsPage } from '@/pages/organizer/exhibitions/list/OrganizerExhibitionsPage';
import { PendingHoldPage } from '@/pages/reservations/pending/PendingHoldPage';
import { TicketDetailPage } from '@/pages/tickets/detail/TicketDetailPage';
import { TicketsListPage } from '@/pages/tickets/list/TicketsListPage';
import { TicketSharePage } from '@/pages/tickets/share/TicketSharePage';
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
        <Route path={ROUTES.eventDetail} element={<EventDetailPage />} />
        <Route
          path={ROUTES.eventSeats}
          element={
            <RequireRole roles={['customer']}>
              <SeatMapPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.pendingHold}
          element={
            <RequireRole roles={['customer']}>
              <PendingHoldPage />
            </RequireRole>
          }
        />
        <Route path={ROUTES.ticketShare} element={<TicketSharePage />} />
        <Route
          path={ROUTES.tickets}
          element={
            <RequireRole roles={['customer']}>
              <TicketsListPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.ticketDetail}
          element={
            <RequireRole roles={['customer']}>
              <TicketDetailPage />
            </RequireRole>
          }
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
