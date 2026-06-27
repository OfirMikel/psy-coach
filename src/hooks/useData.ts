import { useEffect, useState } from 'react'
import type { MappingFile } from '../types'

type DataState = {
  enData: MappingFile | null
  heData: MappingFile | null
  loading: boolean
  error: string | null
}

export function useData(): DataState {
  const [state, setState] = useState<DataState>({
    enData: null,
    heData: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/mapping.json`).then(r => r.json() as Promise<MappingFile>),
      fetch(`${import.meta.env.BASE_URL}data/heb_mapping.json`).then(r => r.json() as Promise<MappingFile>),
    ])
      .then(([enData, heData]) => setState({ enData, heData, loading: false, error: null }))
      .catch(err => setState(s => ({ ...s, loading: false, error: String(err) })))
  }, [])

  return state
}
