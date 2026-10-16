'use client'
import { useEffect } from 'react'
import { registarOrigem } from '@/lib/utm'

/**
 * Guarda de onde veio a visita, logo na primeira página aberta.
 *
 * Tem de correr cedo e em toda a aplicação: alguém pode aterrar num link de
 * modelo partilhado, navegar até aos preços e só depois criar conta — e nessa
 * altura os parâmetros do anúncio já desapareceram do URL.
 */
export default function CapturarOrigem() {
  useEffect(() => {
    registarOrigem()
  }, [])
  return null
}
