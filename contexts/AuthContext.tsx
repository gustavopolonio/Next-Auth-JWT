import { createContext, ReactNode, useState, useEffect } from 'react'
import { parseCookies, setCookie, destroyCookie } from 'nookies'
import Router from 'next/router'
import { api } from '../services/apiClient'

interface User {
  email: string;
  permissions: string[];
  roles: string[]
}
interface CredentialsProps {
  email: string;
  password: string
}

interface AuthContextData {
  signIn(credentials: CredentialsProps): Promise<void>;
  isAuthenticated: boolean;
  user: User | undefined
}

interface AuthProviderProps {
  children: ReactNode
}

let bc: BroadcastChannel

export const AuthContext = createContext({} as AuthContextData)

export function signOut() {
  destroyCookie(null, 'nextauth.token')
  destroyCookie(null, 'nextauth.refreshToken')

  bc.postMessage('signOut')
  
  Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user

  useEffect(() => {
    bc = new BroadcastChannel('auth')

    bc.onmessage = (message) => {
      switch (message.data) {
        case 'signOut':
          Router.push('/')
          break
        case 'signIn':
          window.location.assign('/dashboard')
        default:
          break
      }
    }
  }, [])

  useEffect(() => {
    const cookies = parseCookies()
    const { 'nextauth.token': token } = cookies
    
    if (token) {
      api.get('me').then(response => {
        const { email, permissions, roles } = response.data

        setUser({
          email, 
          permissions,
          roles
        })
      })
      .catch((err) => {
        console.log(err)
        signOut()
      })
    }
  }, [])
 
  async function signIn(credentials: CredentialsProps) {
    try {
      const response = await api.post('sessions', credentials)
      const { permissions, roles, token, refreshToken } = response.data

      setCookie(null, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      setCookie(null, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
      })

      setUser({
        email: credentials.email,
        permissions, 
        roles
      })

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      bc.postMessage('signIn')

      Router.push('/dashboard')

    } catch (err) {
      console.log(err)
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}