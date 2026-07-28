'use client'
import { useI18n } from '@/lib/i18n'

/** Botão de troca de idioma PT / EN */
export default function LanguageToggle() {
  const { lang, setLang } = useI18n()
  return (
    <button
      onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
      className="text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200
                 hover:border-gray-300 rounded-lg px-2 py-1 transition-colors shrink-0"
      title={lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
    >
      {lang === 'pt' ? 'EN' : 'PT'}
    </button>
  )
}
