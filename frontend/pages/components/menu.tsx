import React from 'react'

import { useSessionData } from '../../providers/session.provider'
import { useServerConnection } from '../../providers/server-connecton.provider'
import { HStack, Stack } from '@chakra-ui/layout'
import { Button, IconButton } from '@chakra-ui/button'
import { Input, InputGroup, InputLeftAddon, InputRightElement } from '@chakra-ui/input'
import { useNotify } from 'providers/notification.provider'

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
      <InputGroup size="md">
        <Input
          label="Session ID"
          value={inputSession}
          onChange={event => setInputSession(event.target.value)}
        />
        <InputRightElement>
          <HStack>
            <IconButton
              aria-label="Join Session"
              onClick={() => connection?.join_session(inputSession, notify)}
            />
            <IconButton
              aria-label="Pull From Clipboard"
              onClick={() => navigator.clipboard.readText()
                .then(session => {
                  setInputSession(session)
                  connection?.join_session(session, notify)
                })
              }
            />
          </HStack>
        </InputRightElement>
      </InputGroup>

      <Button onClick={() => goBack()}> Back </Button>
    </Stack>
  )
}

function NavigateComponent({ join }: { join: () => void }) {
  const { connection } = useServerConnection()
  const { getUser } = useSessionData()

  return (
    <Stack>
      <InputGroup>
        <InputLeftAddon children="ID" />
        <Input label="UserID" value={getUser()} readOnly />
      </InputGroup>
      <Button variant="ghost" onClick={() => connection?.disconnect()}> Disconnect </Button>
      <Button variant="ghost" onClick={() => join()}> Join Session </Button>
      <Button variant="ghost" onClick={() => connection?.create_session()}> Create Session </Button>
    </Stack>
  )
}