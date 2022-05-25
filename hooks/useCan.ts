import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

interface UseCanProps {
  permissions?: string[];
  roles?: string[]
}

export function useCan({ permissions, roles }: UseCanProps) {
  const { user, isAuthenticated } = useContext(AuthContext)

  if (!isAuthenticated) {
    return false
  }

  if (permissions?.length > 0) {
    const hasPermissions = permissions.every(permission => {
      return user.permissions.includes(permission)
    })

    return hasPermissions
  }

  if (roles?.length > 0) {
    const hasRoles = roles.some(role => {
      return user.roles.includes(role)
    })

    return hasRoles
  }

  return false
}