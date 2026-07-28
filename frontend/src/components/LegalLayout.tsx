'use client'
import Link from 'next/link'
import Logo from './Logo'
import LanguageToggle from './LanguageToggle'
import { LEGAL } from '@/lib/legal'
import { useI18n } from '@/lib/i18n'
import { ReactNode } from 'react'

/** Moldura comum às páginas legais (Termos, Privacidade). */
export default function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  const { lang } = useI18n()
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/"><Logo height={30} /></Link>
        <LanguageToggle />
      </nav>

      <article className="max-w-3xl mx-auto px-6 sm:px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-gray-400 mb-10">
          {lang === 'pt' ? 'Última atualização' : 'Last updated'}: {LEGAL.lastUpdated}
        </p>
        <div className="space-y-6 text-gray-700 text-[15px] leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-brand-600 [&_a]:underline">
          {children}
        </div>

        <div className="mt-12 pt-6 border-t">
          <Link href="/" className="text-brand-600 hover:underline text-sm">
            ← {lang === 'pt' ? 'Voltar ao início' : 'Back to home'}
          </Link>
        </div>
      </article>
    </div>
  )
}
