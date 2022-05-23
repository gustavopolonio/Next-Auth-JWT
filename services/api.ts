import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../contexts/AuthContext';

interface AxiosResponseError {
  code?: string
}

interface FailedRequestsQueue {
  resolve: (token: string) => void;
  reject: (err: AxiosError) => void
}

let cookies = parseCookies()
let isRefreshing = false
let failedRequestsQueue = Array<FailedRequestsQueue>()

export const api = axios.create({
  baseURL: 'http://localhost:3333'
})

api.defaults.headers.common['Authorization'] = `Bearer ${cookies['nextauth.token']}`

api.interceptors.response.use((response) => {
  return response
}, (error: AxiosError<AxiosResponseError>) => {
  if (error.response?.status === 401) {
    if (error.response?.data?.code === 'token.expired') { // Refresh token
    
      cookies = parseCookies()
      const { 'nextauth.refreshToken': refreshToken } = cookies
      const originalConfig = error.config

      if (!isRefreshing) {
        isRefreshing = true

        api.post('/refresh', {
          refreshToken
        }).then(response => {
          const { token } = response.data
  
          setCookie(null, 'nextauth.token', token, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/'
          })
    
          setCookie(null, 'nextauth.refreshToken', response.data.refreshToken, {
            maxAge: 60 * 60 * 24 * 30,
            path: '/'
          })
  
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          failedRequestsQueue.forEach(request => request.resolve(token))
          failedRequestsQueue = []
        }).catch(err => {
          failedRequestsQueue.forEach(request => request.reject(err))
          failedRequestsQueue = []
        }).finally(() => {
          isRefreshing = false
        })
      }

      return new Promise((resolve, reject) => {
        failedRequestsQueue.push({
          resolve: (token: string) => {
            if (!originalConfig?.headers) {
              return
            }

            originalConfig.headers['Authorization'] = `Barer ${token}`

            resolve(api(originalConfig))
          },

          reject: (err: AxiosError) => {
            reject(err)
          }
        })
      })

    } else {
      // Log out user
      signOut()
    }
  }

  return Promise.reject(error)
})