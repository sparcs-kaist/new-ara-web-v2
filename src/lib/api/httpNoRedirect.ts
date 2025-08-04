import axios from 'axios'
import { errorParser } from '../utils/errorParser'

const apiUrl = (() => {
  if (process.env.NEXT_PUBLIC_API_HOST) {
    return process.env.NEXT_PUBLIC_API_HOST
  }

  const mode = process.env.NODE_ENV
  if (mode === 'production') return 'https://newara.sparcs.org'
  if (mode === 'development') return 'https://newara.dev.sparcs.org'
  throw new Error('Unknown NODE_ENV')
})()

const baseApiAddress = `${apiUrl}/api`

const httpNoRedirect = axios.create({
  baseURL: baseApiAddress,
  withCredentials: true,
})

httpNoRedirect.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const status = error.response.status;

      // 404 에러는 리디렉션하지 않음
      if (typeof window !== 'undefined') {
        if (status === 401) window.location.href = '/login';
        // 404 처리 제거 - 컴포넌트에서 직접 처리하도록 함
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

export default httpNoRedirect;