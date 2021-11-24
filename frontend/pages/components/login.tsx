import React from 'react'

import { Stack } from '@chakra-ui/layout'
import { Button } from '@chakra-ui/button'
import { Input } from '@chakra-ui/input'

import { useLogin } from 'providers/server-connecton.provider'
import { useSessionData } from 'providers/session.provider'
import { Screen, useScreen } from 'providers/screen.provider'

export default function LoginComponent(): JSX.Element {

  const { setScreen } = useScreen()
  const { setUser, getUser } = useSessionData()
  const login = useLogin()

  return (
    <form onSubmit={e => {
      e.preventDefault()
      login({ user: getUser(), success: () => setScreen(Screen.Menu) })
    }}>
      <Stack>
        <Input
          label="UserID"
          placeholder="Enter a name"
          value={getUser()}
          onChange={event => setUser(event.target.value)}
        />
        <Button type="submit" >
          Connect
        </Button>
      </Stack>
    </form>
  )
}