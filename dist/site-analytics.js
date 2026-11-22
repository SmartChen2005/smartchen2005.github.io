(() => {
  const productionHosts = ['www.vegshark.com', 'vegshark.com', 'smartchen2005.github.io'];
  if (window.top !== window.self || !productionHosts.includes(location.hostname) ||
      navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;

  const measurementId = 'G-QV6Y4VJ4N1';
  const referrer = document.referrer ? new URL(document.referrer) : null;
  const pageReferrer = referrer?.origin === location.origin
    ? referrer.origin + referrer.pathname
    : referrer?.origin ?? '';

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: location.origin + location.pathname,
    page_referrer: pageReferrer,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);
})();
