import { createContext, ReactNode, useState } from 'react'
import Router from 'next/router'
import { api } from '../services/api'

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

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user
 
  async function signIn(credentials: CredentialsProps) {
    try {
      const response = await api.post('sessions', credentials)
      const { permissions, roles, token, refreshToken } = response.data

      setUser({
        email: credentials.email,
        permissions, 
        roles
      })

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