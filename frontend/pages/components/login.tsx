import React from 'react'

import { Stack } from '@chakra-ui/layout'
import { Button } from '@chakra-ui/button'
import { Input } from '@chakra-ui/input'

import { useServerConnection } from 'providers/server-connecton.provider'
import { useSessionData } from 'providers/session.provider'
import { Screen, useScreen } from 'providers/screen.provider'
import { useNotify } from "providers/notification.provider"

export default function LoginComponent(): JSX.Element {

  const notify = useNotify()

  const { setScreen } = useScreen()
  const { connection } = useServerConnection()
  const { setUser, getUser } = useSessionData()

  const login = () => {

    connection?.connect(getUser(), {
      open: () => {
        setScreen(Screen.Menu)
        notify('Connected.')
        connection.fetchSession()
      },
      error: () => {
        notify('Error: ID may already be taken.')
      },
      close: () => {
        notify('Disconnected..')
        setScreen(Screen.Login)
      },
    })
  }

  return (
    <form onSubmit={e => {
      e.preventDefault()
      login()
    }}>
      <Stack>
        <Input
          label="UserID"
          placeholder="Enter a name"
          value={getUser()} onChange={event => setUser(event.target.value)}
        />
        <Button type="submit">
          Connect
        </Button>
      </Stack>
    </form>
  )
}