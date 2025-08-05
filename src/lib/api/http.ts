import axios from 'axios'
//  import { getCookie } from '../utils/cookie'
import { errorParser } from '../utils/errorParser'

const apiUrl = (() => {
  if (process.env.NEXT_PUBLIC_API_HOST) {
    return process.env.NEXT_PUBLIC_API_HOST
  }

  const mode = process.env.NODE_ENV
  if (mode === 'production') return 'https://newara.dev.sparcs.org'
  if (mode === 'development') return 'https://newara.dev.sparcs.org'
  throw new Error('Unknown NODE_ENV')
})()

const baseApiAddress = `${apiUrl}/api`

const http = axios.create({
  baseURL: baseApiAddress,
  withCredentials: true,
})

// backend doesn't use CSRF protection yet.
/*
http.interceptors.request.use(
  config => {
    config.headers['X-CSRFToken'] = getCookie('csrftoken')
    return config
  },
  error => Promise.reject(error),
)
*/

http.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const status = error.response.status;

      if (typeof window !== 'undefined') {
        if (status === 401) window.location.href = '/login';
        else if (status === 404) window.location.href = '/404';
        else if (status === 418) window.location.href = '/tos';
        else if (status === 410) window.location.href = '/410';
      }

      if (typeof error.response.data === 'object') {
        error.apierr = errorParser(error.response.data);
      }
    }

    return Promise.reject(error);
  },
);

export default http;
