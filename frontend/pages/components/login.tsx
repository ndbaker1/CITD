import React from 'react'
import { useServerConnection } from '../../providers/server-connecton.provider'

import { useSessionData } from '../../providers/session.provider'
import { Screen, useScreen } from '../../providers/screen.provider'
import { Center, Container } from '@chakra-ui/layout'
import { Button } from '@chakra-ui/button'
import { Input } from '@chakra-ui/input'

export default function LoginComponent(): JSX.Element {

  const { setScreen } = useScreen()
  const { connection } = useServerConnection()
  const { setUser, log, getUser } = useSessionData()

  return (
    <Container maxW="10rem" d="flex" flexDir="column">
      <Input label="UserID" variant="outlined" value={getUser()} onChange={event => setUser(event.target.value)} />
      <Button onClick={() => {
        log('Connecting...')
        connection?.connect(getUser(), {
          open: () => {
            setScreen(Screen.Menu)
            log('Connected..')
            connection.fetchSession()
          },
          error: () => {
            log('Error: ID may already be taken.')
          },
          close: () => {
            log('Disconnected..')
            setScreen(Screen.Login)
          },
        })
      }}> Connect </Button>
    </Container>
  )
}