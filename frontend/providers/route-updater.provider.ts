import { useRouter } from "next/router";
import React from "react";
import { useSessionData } from "./session.provider";

export const ROOM_ID_KEY = 'roomid'

export const getRoomId = () => new URLSearchParams(window.location.search).get(ROOM_ID_KEY)

export function useRouteUpdater() {

  const { getSession } = useSessionData()

  const router = useRouter()

  React.useEffect(() => {
    router.push('/?' + ROOM_ID_KEY + '=' + getSession(), undefined, { shallow: true })
  }, [getSession])
}