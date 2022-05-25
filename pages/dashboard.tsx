import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { Can } from '../components/Can'
import { setupAPIClient } from '../services/api'
import { api } from '../services/apiClient'
import { withSSRAuth } from '../utils/withSSRAuth'

export default function Dashboar() {
  const { user } = useContext(AuthContext)

  useEffect(() => {
    api.get('me')
      .then(response => {console.log(response)})
      .catch(err => console.log(err))
  }, [])

  return (
    <>
      <h1>Dashboard: {user?.email}</h1>

      <Can permissions={['metrics.list']}>
        <h1>Metrics</h1>
      </Can>
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx)
  const response = await apiClient.get('/me')

  return {
    props: {}
  }
})