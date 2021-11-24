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
      <Heading pos="absolute" top="4rem" fontFamily="mono" css="
        background: linear-gradient(to bottom, rgb(144, 205, 244, 0.7), #101820FF);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      ">
        {APP_NAME.toUpperCase()}
      </Heading>

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