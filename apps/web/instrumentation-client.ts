let onRouterTransitionStartHandler:
    | ((
          ...args: Parameters<
              typeof import('@sentry/nextjs').captureRouterTransitionStart
          >
      ) => void)
    | undefined;

if (process.env.NEXT_PUBLIC_DISABLE_SENTRY !== '1') {
    void import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
            dsn: 'https://cdc7b4ceb055651965712b48974a5208@o4511384850661376.ingest.us.sentry.io/4511384856690688',
            integrations: [Sentry.replayIntegration()],
            tracesSampleRate: 1,
            enableLogs: true,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            sendDefaultPii: true,
        });

        onRouterTransitionStartHandler = Sentry.captureRouterTransitionStart;
    });
}

export const onRouterTransitionStart: typeof import('@sentry/nextjs').captureRouterTransitionStart =
    (...args) => onRouterTransitionStartHandler?.(...args);
