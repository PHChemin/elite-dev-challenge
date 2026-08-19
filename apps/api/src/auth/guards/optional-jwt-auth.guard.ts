import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';
import type { ExecutionContext } from '@nestjs/common';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
    }>();
    if (!request.headers.authorization) {
      return true;
    }
    return super.canActivate(context);
  }
}
