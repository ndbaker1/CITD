import React from 'react'

import { useSessionData } from '../../providers/session.provider'
import { useServerConnection } from '../../providers/server-connecton.provider'
import { Container, Stack, Text } from '@chakra-ui/layout'
import { Button } from '@chakra-ui/button'
import { Input, InputGroup, InputLeftAddon, InputRightElement } from '@chakra-ui/input'
import { Tooltip } from '@chakra-ui/react'

export default function MenuComponent(): JSX.Element {
  const [joining, setJoining] = React.useState(false)
  return (
    <Container d="flex" flexDir="column">
      {
        joining
          ? <JoinSessionComponent goBack={() => setJoining(false)} />
          : <NavigateComponent join={() => setJoining(true)} />
      }
    </Container>
  )
}

function JoinSessionComponent({ goBack }: { goBack: () => void }) {
  const { connection } = useServerConnection()
  const { log } = useSessionData()

  const [inputSession, setInputSession] = React.useState('')

  return (
    <>
      <div>
        <InputGroup>

          <Input
            label="Session ID"
            variant="outlined"
            value={inputSession}
            onChange={event => setInputSession(event.target.value)}
          />
          <InputRightElement>
            <Tooltip title="Join">
              {/* <IconButton
                onClick={() => connection?.join_session(inputSession, (error) => log(error))}
              >
              </IconButton> */}
            </Tooltip>
            <Tooltip title="Pull From Clipboard">
              {/* <IconButton
                onClick={() => navigator.clipboard.readText()
                  .then(session => {
                    setInputSession(session)
                    connection?.join_session(session, (error) => log(error))
                  })
                }>
              </IconButton> */}
            </Tooltip>
          </InputRightElement>
          <InputRightElement>
          </InputRightElement>
        </InputGroup>
      </div>
      <Button onClick={() => goBack()}> Back </Button>
    </>
  )
}

function NavigateComponent({ join }: { join: () => void }) {
  const { connection } = useServerConnection()
  const { getUser } = useSessionData()

  return (
    <Stack>
      <InputGroup size="sm">
        <InputLeftAddon children="ID" />
        <Input label="UserID" value={getUser()} readOnly />
      </InputGroup>
      <Button variant="ghost" onClick={() => connection?.disconnect()}> Disconnect </Button>
      <Button variant="ghost" onClick={() => join()}> Join Session </Button>
      <Button variant="ghost" onClick={() => connection?.create_session()}> Create Session </Button>
    </Stack>
  )
}