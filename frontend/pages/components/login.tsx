import React from 'react'

import { Heading, Stack } from '@chakra-ui/layout'
import { Button } from '@chakra-ui/button'
import { Input } from '@chakra-ui/input'

import { useLogin } from 'providers/server-connecton.provider'
import { useSessionData } from 'providers/session.provider'
import { Screen, useScreen } from 'providers/screen.provider'

import { APP_NAME } from 'environment'

export default function LoginComponent(): JSX.Element {

  const { setScreen } = useScreen()
  const { setUser, getUser } = useSessionData()
  const login = useLogin()

  return (
    <>
      <Title />

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
    </>
  )
}


function Title() {
  return (
    <Heading
      pos="absolute"
      top="4rem"
      fontFamily="mono"
      css="color: rgb(144, 205, 244, 0.2)"
      backgroundImage='url(/smoke.webp)'
      backgroundSize='cover'
      backgroundClip='text'
    >
      {APP_NAME.toUpperCase()}
    </Heading>
  )
}