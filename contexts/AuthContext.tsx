import { createContext, ReactNode } from 'react'
import { api } from '../services/api'

interface CredentialsProps {
  email: string,
  password: string
}

interface AuthContextData {
  signIn(credentials: CredentialsProps): Promise<void>,
  isAuthenticated: boolean
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {

  async function signIn(credentials: CredentialsProps) {
    try {
      const response = await api.post('sessions', credentials)
      console.log('response', response)

    } catch (err) {
      console.log(err)
    }
  }

  const isAuthenticated = false

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}