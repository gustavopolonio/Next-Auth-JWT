import axios, { AxiosError } from 'axios'
import { GetServerSidePropsContext } from 'next';
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../contexts/AuthContext';
import { AuthTokenError } from './errors/AuthTokenError';

interface AxiosResponseError {
  code?: string
}

interface FailedRequestsQueue {
  resolve: (token: string) => void;
  reject: (err: AxiosError) => void
}

type Context = undefined | GetServerSidePropsContext

let isRefreshing = false
let failedRequestsQueue = Array<FailedRequestsQueue>()

export function setupAPIClient(ctx: Context = undefined) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: 'http://localhost:3333'
  })
  
  api.defaults.headers.common['Authorization'] = `Bearer ${cookies['nextauth.token']}`
  
  api.interceptors.response.use((response) => {
    return response
  }, (error: AxiosError<AxiosResponseError>) => {
    if (error.response?.status === 401) {
      if (error.response?.data?.code === 'token.expired') { // Refresh token
      
        cookies = parseCookies(ctx)
        const { 'nextauth.refreshToken': refreshToken } = cookies
        const originalConfig = error.config
  
        if (!isRefreshing) {
          isRefreshing = true
  
          api.post('/refresh', {
            refreshToken
          }).then(response => {
            const { token } = response.data
    
            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/'
            })
      
            setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30,
              path: '/'
            })
    
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  
            failedRequestsQueue.forEach(request => request.resolve(token))
            failedRequestsQueue = []
          }).catch(err => {
            failedRequestsQueue.forEach(request => request.reject(err))
            failedRequestsQueue = []
  
            if (typeof window !== 'undefined') {
              signOut()
            }
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
        if (typeof window !== 'undefined') {
          signOut()
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
  
    return Promise.reject(error)
  })

  return api
}