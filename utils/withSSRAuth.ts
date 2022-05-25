import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";
import { validateUserPermissions } from './validateUserPermissions'
import jwt_decode from 'jwt-decode'

interface WithSSRAuthOptions {
  permissions?: string[];
  roles?: string[]
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions) {

  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    
    const cookies = parseCookies(ctx)
    const token = cookies['nextauth.token']
  
    if (!token) {
      return {
        redirect: {
          destination: '/',
          permanent: false
        }
      }
    }

    if (options) {
      const user = jwt_decode<{ permissions: string[], roles: string[] }>(token)
      const { permissions, roles } = options
  
      const userHasValidPermissions = validateUserPermissions({ user, permissions, roles })
  
      if (!userHasValidPermissions) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false
          }
        }
      }
    }


    try {
      return await fn(ctx)
    } catch(err) {
      if (err instanceof AuthTokenError) {
        destroyCookie(ctx, 'nextauth.token')
        destroyCookie(ctx, 'nextauth.refreshToken')
    
        return {
          redirect: {
            destination: '/',
            permanent: false
          }
        }
      }
    }

    // Se der erro e não for do tipo AuthTokenError, envio o usuário para uma pág de erro padrão, por exemplo "Tente novamente mais tarde"
    // return {
    //   redirect: {
    //     destination: '/error',
    //     permanent: false
    //   }
    // }
  }
}