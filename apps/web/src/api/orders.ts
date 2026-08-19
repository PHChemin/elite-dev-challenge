import { apiPost } from './client';
import type { OrderResponse, PayOrderPayload } from './types';

export function payOrder(payload: PayOrderPayload): Promise<OrderResponse> {
  return apiPost<OrderResponse>('/orders/pay', payload);
}
