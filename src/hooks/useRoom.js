import { useEffect, useState } from 'react'
import { doc, collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// 방 전체(config + teams + lands)를 실시간 구독 (PRD 5장 onSnapshot)
export function useRoom(code) {
  const [room, setRoom] = useState(null)
  const [teams, setTeams] = useState({})
  const [lands, setLands] = useState({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    setNotFound(false)

    const unsubRoom = onSnapshot(doc(db, 'rooms', code), (snap) => {
      if (!snap.exists()) {
        setRoom(null)
        setNotFound(true)
      } else {
        setRoom({ id: snap.id, ...snap.data() })
        setNotFound(false)
      }
      setLoading(false)
    })

    const unsubTeams = onSnapshot(collection(db, 'rooms', code, 'teams'), (qs) => {
      const next = {}
      qs.forEach((d) => (next[d.id] = d.data()))
      setTeams(next)
    })

    const unsubLands = onSnapshot(collection(db, 'rooms', code, 'lands'), (qs) => {
      const next = {}
      qs.forEach((d) => (next[Number(d.id)] = d.data()))
      setLands(next)
    })

    return () => {
      unsubRoom()
      unsubTeams()
      unsubLands()
    }
  }, [code])

  return { room, teams, lands, loading, notFound }
}
