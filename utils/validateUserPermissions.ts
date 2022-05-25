interface User {
  permissions: string[];
  roles: string[]
}

interface ValidateUserPermissionsParams {
  user: User;
  permissions?: string[];
  roles?: string[]
}

export function validateUserPermissions({ user, permissions, roles }: ValidateUserPermissionsParams) {
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