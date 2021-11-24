import React from 'react'

import { useSessionData } from '../../providers/session.provider'
import { useServerConnection } from '../../providers/server-connecton.provider'
import { HStack, Stack } from '@chakra-ui/layout'
import { Button, IconButton } from '@chakra-ui/button'
import { Input, InputGroup, InputLeftAddon, InputRightAddon } from '@chakra-ui/input'
import { useNotify } from 'providers/notification.provider'
import { CheckIcon, DownloadIcon } from '@chakra-ui/icons'
import { Screen, useScreen } from 'providers/screen.provider'

export default function MenuComponent(): JSX.Element {
  const [joining, setJoining] = React.useState(false)

  return joining
    ? <JoinSessionComponent goBack={() => setJoining(false)} />
    : <NavigateComponent join={() => setJoining(true)} />
}

function JoinSessionComponent({ goBack }: { goBack: () => void }) {

  const notify = useNotify()

  const { connection } = useServerConnection()

  const [inputSession, setInputSession] = React.useState('')

  return (
    <Stack>
      <form onSubmit={e => {
        e.preventDefault()
        connection?.join_session(inputSession, notify)
      }}>
        <InputGroup>
          <Input
            label="Session ID"
            placeholder="Enter a SessionID to Join"
            value={inputSession}
            onChange={event => setInputSession(event.target.value)}
          />
          <InputRightAddon
            bg="transparent"
            border="none"
          >
            <HStack>
              <IconButton
                icon={<CheckIcon />}
                title="Join Session"
                aria-label="join"
                type="submit"
              />
              <IconButton
                icon={<DownloadIcon />}
                title="Pull From Clipboard"
                aria-label="copy-from-clip"
                onClick={() =>
                  navigator.clipboard.readText()
                    .then(session => {
                      setInputSession(session)
                      connection?.join_session(session, notify)
                    })
                }
              />
            </HStack>
          </InputRightAddon>
        </InputGroup>
      </form>
      <Button onClick={() => goBack()}> Back </Button>
    </Stack >
  )
}

function NavigateComponent({ join }: { join: () => void }) {
  const { setScreen } = useScreen()
  const { connection } = useServerConnection()
  const { getUser } = useSessionData()

  return (
    <Stack>
      <InputGroup>
        <InputLeftAddon children="ID" />
        <Input label="UserID" value={getUser()} readOnly />
      </InputGroup>
      <Button onClick={() => {
        connection?.disconnect()
        setScreen(Screen.Login)
      }}>
        Disconnect
      </Button>
      <Button onClick={() => join()}> Join Session </Button>
      <Button onClick={() => connection?.create_session()}> Create Session </Button>
    </Stack>
  )
}