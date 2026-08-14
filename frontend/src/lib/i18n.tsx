'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Lang = 'pt' | 'en'

const dict: Record<string, { pt: string; en: string }> = {
  // Nav
  'nav.pricing': { pt: 'Preços', en: 'Pricing' },
  'nav.login': { pt: 'Entrar', en: 'Log in' },
  'nav.start': { pt: 'Começar grátis', en: 'Start free' },
  'nav.myModels': { pt: 'Os meus modelos', en: 'My models' },
  'nav.terms': { pt: 'Termos', en: 'Terms' },
  'nav.privacy': { pt: 'Privacidade', en: 'Privacy' },

  // Hero
  'hero.title1': { pt: 'Transforma fotos em', en: 'Turn photos into' },
  'hero.title2': { pt: 'modelos 3D fotorrealistas', en: 'photorealistic 3D models' },
  'hero.subtitle': {
    pt: 'Tira 4 a 6 fotos do teu produto. Em minutos tens um modelo 3D interativo, pronto para a tua loja online — sem scanner, sem software, sem complicações.',
    en: 'Take 4 to 6 photos of your product. In minutes you get an interactive 3D model, ready for your online store — no scanner, no software, no hassle.',
  },
  'hero.cta': { pt: 'Criar o meu primeiro modelo →', en: 'Create my first model →' },
  'hero.ctaPricing': { pt: 'Ver preços', en: 'See pricing' },
  'hero.trust': { pt: '3 modelos grátis por mês · Sem cartão de crédito', en: '3 free models per month · No credit card' },

  // Hero visual
  'visual.front': { pt: 'Frente', en: 'Front' },
  'visual.side': { pt: 'Lado', en: 'Side' },
  'visual.back': { pt: 'Trás', en: 'Back' },
  'visual.ai': { pt: 'IA', en: 'AI' },
  'visual.model': { pt: 'Modelo 3D', en: '3D model' },

  // Galeria de exemplos
  'gallery.title': { pt: 'Feito com o Snap3D', en: 'Made with Snap3D' },
  'gallery.subtitle': {
    pt: 'Exemplos reais: a foto que entrou e o modelo 3D que saiu. Clica para rodar.',
    en: 'Real examples: the photo that went in and the 3D model that came out. Click to rotate.',
  },
  'gallery.photo': { pt: 'Foto', en: 'Photo' },
  'gallery.model': { pt: 'Modelo 3D', en: '3D model' },
  'gallery.view': { pt: 'Ver em 3D →', en: 'View in 3D →' },
  'gallery.credit': {
    pt: 'Fotos de demonstração: Google Scanned Objects (CC BY 4.0)',
    en: 'Demo photos: Google Scanned Objects (CC BY 4.0)',
  },

  // Trust bar
  'trust.time': { pt: 'minutos por modelo', en: 'minutes per model' },
  'trust.photos': { pt: 'fotos bastam', en: 'photos are enough' },
  'trust.formats': { pt: 'formatos de download', en: 'download formats' },
  'trust.free': { pt: 'modelos grátis/mês', en: 'free models/month' },

  // Benefits
  'benefits.title': { pt: 'Porquê Snap3D?', en: 'Why Snap3D?' },
  'benefits.subtitle': { pt: 'Tudo o que precisas, nada do que não precisas.', en: 'Everything you need, nothing you don\'t.' },
  'benefits.fast.title': { pt: 'Rápido', en: 'Fast' },
  'benefits.fast.desc': { pt: 'Do upload ao modelo 3D em poucos minutos. Sem esperas longas nem processos complicados.', en: 'From upload to 3D model in minutes. No long waits or complicated processes.' },
  'benefits.real.title': { pt: 'Fotorrealista', en: 'Photorealistic' },
  'benefits.real.desc': { pt: 'IA de última geração que captura cores e brilho reais — qualidade de e-commerce.', en: 'State-of-the-art AI that captures real colors and shine — e-commerce quality.' },
  'benefits.phone.title': { pt: 'Só precisas do telemóvel', en: 'Just your phone' },
  'benefits.phone.desc': { pt: 'Sem scanners caros nem software técnico. Bastam fotos normais do produto.', en: 'No expensive scanners or technical software. Just regular product photos.' },

  // How it works
  'how.title': { pt: 'Como funciona', en: 'How it works' },
  'how.s1.title': { pt: 'Tira as fotos', en: 'Take the photos' },
  'how.s1.desc': { pt: 'Fotografa o produto de 4 a 6 ângulos diferentes. Temos um guia visual para te ajudar a tirar fotos perfeitas.', en: 'Photograph the product from 4 to 6 different angles. We have a visual guide to help you take perfect photos.' },
  'how.s2.title': { pt: 'A IA gera o 3D', en: 'AI generates the 3D' },
  'how.s2.desc': { pt: 'A nossa IA combina as fotos e reconstrói o produto em 3D, com texturas e cores reais.', en: 'Our AI combines the photos and reconstructs the product in 3D, with real textures and colors.' },
  'how.s3.title': { pt: 'Usa em qualquer lado', en: 'Use it anywhere' },
  'how.s3.desc': { pt: 'Vê no browser, descarrega (.glb, .obj, .stl para impressão 3D) ou incorpora na tua loja com um widget.', en: 'View in the browser, download (.glb, .obj, .stl for 3D printing) or embed in your store with a widget.' },

  // Use cases
  'cases.title': { pt: 'Perfeito para', en: 'Perfect for' },
  'cases.subtitle': { pt: 'Onde os modelos 3D fazem a diferença.', en: 'Where 3D models make the difference.' },
  'cases.stores': { pt: 'Lojas online', en: 'Online stores' },
  'cases.markets': { pt: 'Marketplaces', en: 'Marketplaces' },
  'cases.print': { pt: 'Impressão 3D', en: '3D printing' },
  'cases.ar': { pt: 'Catálogos / AR', en: 'Catalogs / AR' },

  // Pricing preview
  'pricing.title': { pt: 'Preços simples e transparentes', en: 'Simple, transparent pricing' },
  'pricing.subtitle': { pt: 'Começa grátis, escala quando precisares.', en: 'Start free, scale when you need to.' },
  'pricing.free': { pt: 'Grátis', en: 'Free' },
  'pricing.popular': { pt: 'Mais popular', en: 'Most popular' },
  'pricing.modelsFree': { pt: '3 modelos/mês', en: '3 models/month' },
  'pricing.modelsCreator': { pt: '25 modelos/mês', en: '25 models/month' },
  'pricing.modelsPro': { pt: 'Modelos ilimitados', en: 'Unlimited models' },
  'pricing.details': { pt: 'Ver todos os detalhes →', en: 'See all details →' },

  // FAQ
  'faq.title': { pt: 'Perguntas frequentes', en: 'Frequently asked questions' },
  'faq.q1': { pt: 'Quantas fotos preciso de tirar?', en: 'How many photos do I need?' },
  'faq.a1': { pt: 'Basta 1 foto, mas para o melhor resultado recomendamos 4 a 6 fotos do produto de ângulos diferentes (frente, trás, lados). Temos um guia visual dentro da app.', en: 'Just 1 photo works, but for the best result we recommend 4 to 6 photos from different angles (front, back, sides). There\'s a visual guide inside the app.' },
  'faq.q2': { pt: 'Quanto tempo demora a gerar um modelo?', en: 'How long does it take to generate a model?' },
  'faq.a2': { pt: 'Normalmente alguns minutos. Depois recebes um modelo 3D interativo que podes ver, descarregar ou incorporar.', en: 'Usually a few minutes. Then you get an interactive 3D model you can view, download or embed.' },
  'faq.q3': { pt: 'Que formatos posso descarregar?', en: 'What formats can I download?' },
  'faq.a3': { pt: 'Todos os planos incluem .glb. Os planos pagos incluem ainda .obj e .stl — este último pronto para impressão 3D.', en: 'All plans include .glb. Paid plans also include .obj and .stl — the latter ready for 3D printing.' },
  'faq.q4': { pt: 'Posso usar os modelos na minha loja online?', en: 'Can I use the models in my online store?' },
  'faq.a4': { pt: 'Sim! Tens um widget para incorporar o modelo 3D em qualquer site. O plano Pro inclui também uso comercial.', en: 'Yes! There\'s a widget to embed the 3D model on any website. The Pro plan also includes commercial use.' },
  'faq.q5': { pt: 'Que tipo de produtos funcionam melhor?', en: 'What kind of products work best?' },
  'faq.a5': { pt: 'Produtos sólidos e foscos, bem iluminados, com fundo simples. Objetos transparentes ou muito brilhantes são mais difíceis para a IA.', en: 'Solid, matte products, well lit, with a simple background. Transparent or very shiny objects are harder for the AI.' },
  'faq.q6': { pt: 'É mesmo grátis?', en: 'Is it really free?' },
  'faq.a6': { pt: 'Sim, o plano Explorer dá-te 3 modelos por mês de graça, sem cartão. Só pagas se quiseres mais modelos ou tirar a marca de água.', en: 'Yes, the Explorer plan gives you 3 free models per month, no card. You only pay for more models or to remove the watermark.' },

  // CTA final
  'cta.title': { pt: 'Pronto para dar vida aos teus produtos?', en: 'Ready to bring your products to life?' },
  'cta.subtitle': { pt: 'Cria o teu primeiro modelo 3D grátis hoje. Não precisas de cartão.', en: 'Create your first 3D model free today. No card needed.' },
  'cta.button': { pt: 'Começar grátis →', en: 'Start free →' },
}

const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({
  lang: 'pt',
  setLang: () => {},
  t: (k) => k,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('pt')

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('lang')) as Lang | null
    if (saved === 'pt' || saved === 'en') setLangState(saved)
    else if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en')) setLangState('en')
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    if (typeof window !== 'undefined') localStorage.setItem('lang', l)
  }

  const t = (k: string) => dict[k]?.[lang] ?? dict[k]?.pt ?? k

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
