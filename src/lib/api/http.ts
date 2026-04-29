import axios from 'axios'
import { getCookie } from '../utils/cookie'
import { errorParser } from '../utils/errorParser'

export const apiUrl = (() => {
  if (process.env.NEXT_PUBLIC_API_HOST) {
    return process.env.NEXT_PUBLIC_API_HOST
  }

  const mode = process.env.NEXT_PUBLIC_APP_ENV
  if (mode === 'production') return 'https://newara.sparcs.org'
  if (mode === 'development') return 'https://newara.dev.sparcs.org'
  throw new Error('Unknown NEXT_PUBLIC_APP_ENV')
})()

const baseApiAddress = `${apiUrl}/api`

const http = axios.create({
  baseURL: baseApiAddress,
  withCredentials: true,
})

http.interceptors.request.use(
  config => {
    config.headers['X-CSRFToken'] = getCookie('csrftoken')
    return config
  },
  error => Promise.reject(error),
)


http.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const status = error.response.status;

      if (typeof window !== 'undefined') {
        // The WebView shell has no equivalents for the desktop /login,
        // /404, /tos, /410 routes — bouncing there pops the user out of
        // the WebView entirely. Callers under /web_view/* handle errors
        // locally (auth gate in Main/page.tsx, in-page error states,
        // pagination guards), so we skip the global redirects there.
        const isWebView = window.location.pathname.startsWith('/web_view/');

        if (!isWebView) {
          if (status === 401 && window.location.pathname !== '/login') window.location.href = '/login';
          else if (status === 404 && window.location.pathname !== '/404') window.location.href = '/404';
          else if (status === 418 && window.location.pathname !== '/tos') window.location.href = '/tos';
          else if (status === 410 && window.location.pathname !== '/410') window.location.href = '/410';
        }
      }

      if (typeof error.response.data === 'object') {
        error.apierr = errorParser(error.response.data);
      }
    }

    return Promise.reject(error);
  },
);

export default http;
