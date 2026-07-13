"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

export function RecaptchaWidget({ onChange }: { onChange: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!siteKey || !ready || !containerRef.current || !window.grecaptcha || widgetId.current !== null) return;

    widgetId.current = window.grecaptcha.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onChange(token),
      "expired-callback": () => onChange(null),
      "error-callback": () => onChange(null),
    });
  }, [onChange, ready, siteKey]);

  if (!siteKey) return null;

  return (
    <div className="min-h-[78px]">
      <Script src="https://www.google.com/recaptcha/api.js?render=explicit" strategy="afterInteractive" onLoad={() => setReady(true)} />
      <div ref={containerRef} />
    </div>
  );
}
