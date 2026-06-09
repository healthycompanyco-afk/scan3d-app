'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

/**
 * Botões da navbar que se adaptam ao estado de login:
 * - Autenticado → "Os meus modelos"
 * - Não autenticado → "Preços / Entrar / Começar grátis"
 */
export default function NavAuth() {
  const supabase = createClientComponentClient()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
  }, [supabase])

  // Enquanto não sabemos, mostra só Preços (evita "saltos" visuais)
  if (loggedIn === null) {
    return (
      <div className="flex gap-3 sm:gap-4 items-center">
        <Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm">Preços</Link>
      </div>
    )
  }

  if (loggedIn) {
    return (
      <div className="flex gap-3 sm:gap-4 items-center">
        <Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm">Preços</Link>
        <Link href="/dashboard" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 text-sm font-medium">
          Os meus modelos
        </Link>
      </div>
    )
  }

  return (
    <div className="flex gap-3 sm:gap-4 items-center">
      <Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm">Preços</Link>
      <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">Entrar</Link>
      <Link href="/login" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 text-sm font-medium">
        Começar grátis
      </Link>
    </div>
  )
}
