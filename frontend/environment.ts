const SSL = !!process.env.GATSBY_SSL
export const environment = {
  apiDomain: process.env.GATSBY_API_DOMAIN || 'localhost:8000',
  ws_or_wss: SSL ? 'wss' : 'ws',
  http_or_https: SSL ? 'https' : 'http',
  healthCheck: true,
}