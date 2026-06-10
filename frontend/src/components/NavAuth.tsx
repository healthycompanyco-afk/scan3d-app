'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import LanguageToggle from './LanguageToggle'

/**
 * Botões da navbar que se adaptam ao estado de login:
 * - Autenticado → "Os meus modelos"
 * - Não autenticado → "Preços / Entrar / Começar grátis"
 */
export default function NavAuth() {
  const supabase = createClientComponentClient()
  const { t } = useI18n()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
  }, [supabase])

  return (
    <div className="flex gap-3 sm:gap-4 items-center">
      <LanguageToggle />
      <Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm">{t('nav.pricing')}</Link>
      {loggedIn === null ? null : loggedIn ? (
        <Link href="/dashboard" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 text-sm font-medium">
          {t('nav.myModels')}
        </Link>
      ) : (
        <>
          <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">{t('nav.login')}</Link>
          <Link href="/login" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 text-sm font-medium">
            {t('nav.start')}
          </Link>
        </>
      )}
    </div>
  )
}
