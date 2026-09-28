export interface NotificationDispatchPayload {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  channel: 'PUSH' | 'IN_APP' | 'EMAIL';
  deviceTokens?: string[];
  metadata?: Record<string, unknown>;
}

export interface NotificationDispatchResult {
  success: boolean;
  provider: string;
  deliveredCount: number;
  invalidTokens?: string[];
  error?: string;
}

export interface INotificationProvider {
  readonly name: string;
  send(payload: NotificationDispatchPayload): Promise<NotificationDispatchResult>;
}

export class MockNotificationProvider implements INotificationProvider {
  readonly name = 'MockNotificationProvider';
  public sentNotifications: NotificationDispatchPayload[] = [];

  send(payload: NotificationDispatchPayload): Promise<NotificationDispatchResult> {
    this.sentNotifications.push(payload);
    return Promise.resolve({
      success: true,
      provider: this.name,
      deliveredCount: 1,
    });
  }
}
