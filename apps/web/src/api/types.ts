export type Role = 'admin' | 'organizer' | 'customer' | 'gate';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type FieldErrors = Record<string, string[]>;

export type ApiErrorBody = {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  fieldErrors?: FieldErrors;
};
