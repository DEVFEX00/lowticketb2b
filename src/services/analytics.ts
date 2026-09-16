export interface AnalyticsEventPayload {
  [key: string]: any;
}

export function trackEvent(eventName: string, payload: AnalyticsEventPayload = {}): void {
  const timestamp = new Date().toISOString();
  console.log(`[FEX Analytics: ${eventName}]`, { ...payload, timestamp });

  try {
    if (typeof window !== 'undefined') {
      // Standard dataLayer push (GA4/GTM ready)
      if ((window as any).dataLayer && Array.isArray((window as any).dataLayer)) {
        (window as any).dataLayer.push({ event: eventName, ...payload, timestamp });
      }
      // Meta Pixel ready
      if (typeof (window as any).fbq === 'function') {
        (window as any).fbq('trackCustom', eventName, payload);
      }
    }
  } catch (e) {
    // Fail-safe
  }
}
