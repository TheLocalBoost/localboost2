'use client'
import { createContext, useContext } from 'react'

export const ProContext = createContext(false)
export const usePro = () => useContext(ProContext)
