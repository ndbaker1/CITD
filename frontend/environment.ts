export const APP_NAME = "Connect In The Dark"

const SSL = true || !!process.env.SSL
export const environment = {
  apiDomain: 'connect-in-the-dark.herokuapp.com:8000' || process.env.API_DOMAIN || 'localhost:8000',
  ws_or_wss: SSL ? 'wss' : 'ws',
  http_or_https: SSL ? 'https' : 'http',
  healthCheck: true,
}