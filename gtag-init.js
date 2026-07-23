// @ts-ignore — window.dataLayer is a Google Analytics global convention
window.dataLayer = window.dataLayer || [];
/** @type {(...args: any[]) => void} */
function gtag() { // @ts-ignore
  window.dataLayer.push(arguments); }

/* Google Consent Mode v2.
   Storage is denied by default in regions that require prior consent (EEA, UK,
   Switzerland). GA still receives cookieless pings there, so aggregate traffic
   is measured without setting identifiers. Everywhere else analytics storage is
   granted by default. Ad storage stays denied globally — this site runs no ads.
   If a consent banner is added later, call:
     gtag('consent', 'update', { analytics_storage: 'granted' })  */
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500,
  region: [
    'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR',
    'GB', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT',
    'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
  ]
});

gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'granted'
});

gtag('js', new Date());
gtag('config', 'G-X42B535184');
