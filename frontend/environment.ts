export const APP_NAME = "Connect In The Dark"

/**
 * Environment Variables:
 * 
 * NEXT_PUBLIC_API_DOMAIN
 *  - is the hostname of the deployment
 */
const { NEXT_PUBLIC_API_DOMAIN } = process.env

export const environment = {
  apiPath: NEXT_PUBLIC_API_DOMAIN,
  healthCheck: true,
}