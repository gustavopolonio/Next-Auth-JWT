import type { NextPage } from 'next'
import { useState, FormEvent, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { withSSRGuest } from '../utils/withSSRGuest'

import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const { signIn } = useContext(AuthContext)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const data = {
      email,
      password
    }

    await signIn(data)
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type='submit'>Entrar</button>
    </form>
  )
}

export default Home


export const getServerSideProps = withSSRGuest(async (ctx) => {

  return {
    props: {}
  }
})