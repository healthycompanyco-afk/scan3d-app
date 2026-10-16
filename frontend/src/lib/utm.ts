/**
 * Origem da visita (utm_source e companhia).
 *
 * Serve para saber que anúncio, campanha ou publicação trouxe cada registo.
 * Sem isto, gastar em publicidade compra cliques e nenhuma informação.
 *
 * Duas decisões deliberadas:
 *
 * 1. **Primeiro toque, e nunca mais muda.** Quem chega por um anúncio e volta
 *    uma semana depois por pesquisa deve continuar a contar para o anúncio.
 *    Tanto aqui como na base de dados só se grava se ainda estiver vazio.
 *
 * 2. **Sem cookies.** Fica em sessionStorage até ao registo e depois passa
 *    para o perfil do próprio utilizador. Não há identificadores partilhados
 *    com terceiros, ao contrário de um pixel da Meta ou de uma etiqueta do
 *    Google Ads — que obrigariam a um banner de consentimento.
 */

export type Origem = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

const CHAVE = 'snap3d_origem'
const CAMPOS = ['utm_source', 'utm_medium', 'utm_campaign'] as const

/** Limita o tamanho e tira caracteres estranhos — isto vem do URL. */
function limpar(valor: string): string {
  return valor.replace(/[^\w.\-/ ]/g, '').slice(0, 64)
}

/**
 * Lê os parâmetros do URL na primeira página visitada e guarda-os.
 * Chamar no arranque da aplicação. Não faz nada se já houver origem guardada.
 */
export function registarOrigem(): void {
  if (typeof window === 'undefined') return
  try {
    if (sessionStorage.getItem(CHAVE)) return // primeiro toque já registado

    const p = new URLSearchParams(window.location.search)
    const origem: Origem = {}
    for (const campo of CAMPOS) {
      const v = p.get(campo)
      if (v) origem[campo] = limpar(v)
    }

    // Sem parâmetros mas com referência externa: fica a saber-se de onde veio
    if (!origem.utm_source && document.referrer) {
      try {
        const anfitriao = new URL(document.referrer).hostname
        if (anfitriao && anfitriao !== window.location.hostname) {
          origem.utm_source = limpar(anfitriao.replace(/^www\./, ''))
          origem.utm_medium = 'referral'
        }
      } catch {
        /* referrer inválido — ignorar */
      }
    }

    if (Object.keys(origem).length > 0) {
      sessionStorage.setItem(CHAVE, JSON.stringify(origem))
    }
  } catch {
    /* sessionStorage bloqueado (janela privada, por exemplo) — seguir sem isto */
  }
}

/** Devolve a origem guardada, ou um objeto vazio. */
export function lerOrigem(): Origem {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE) || '{}') as Origem
  } catch {
    return {}
  }
}
