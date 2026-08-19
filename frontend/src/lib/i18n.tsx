'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
  'visual.ai': { pt: 'Snap3D', en: 'Snap3D' },
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

  // ---- Login ----
  'login.signupTitle': { pt: 'Criar conta', en: 'Create account' },
  'login.signinTitle': { pt: 'Entrar', en: 'Log in' },
  'login.signupSub': { pt: 'Começa com 3 modelos grátis por mês.', en: 'Start with 3 free models per month.' },
  'login.signinSub': { pt: 'Bem-vindo de volta.', en: 'Welcome back.' },
  'login.google': { pt: 'Continuar com Google', en: 'Continue with Google' },
  'login.orEmail': { pt: 'ou com email', en: 'or with email' },
  'login.password': { pt: 'Password', en: 'Password' },
  'login.processing': { pt: 'A processar...', en: 'Working...' },
  'login.haveAccount': { pt: 'Já tens conta?', en: 'Already have an account?' },
  'login.noAccount': { pt: 'Não tens conta?', en: "Don't have an account?" },
  'login.createFree': { pt: 'Criar conta grátis', en: 'Create free account' },
  'login.checkEmail': { pt: 'Verifica o teu email para confirmar a conta.', en: 'Check your email to confirm your account.' },
  'login.legalPre': { pt: 'Ao criar conta aceitas os', en: 'By creating an account you accept the' },
  'login.legalAnd': { pt: 'e a', en: 'and the' },
  'login.termsFull': { pt: 'Termos', en: 'Terms' },
  'login.privacyFull': { pt: 'Política de Privacidade', en: 'Privacy Policy' },

  // ---- Dashboard ----
  'dash.loading': { pt: 'A carregar...', en: 'Loading...' },
  'dash.plans': { pt: 'Planos', en: 'Plans' },
  'dash.logout': { pt: 'Sair', en: 'Log out' },
  'dash.newModel': { pt: '+ Novo modelo', en: '+ New model' },
  'dash.title': { pt: 'Os meus modelos', en: 'My models' },
  'dash.plan': { pt: 'Plano:', en: 'Plan:' },
  'dash.upgrade': { pt: 'Fazer upgrade →', en: 'Upgrade →' },
  'dash.manageSub': { pt: 'Gerir subscrição', en: 'Manage subscription' },
  'dash.empty': { pt: 'Ainda não tens modelos.', en: "You don't have any models yet." },
  'dash.createFirst': { pt: 'Criar o primeiro modelo →', en: 'Create your first model →' },
  'dash.paidTitle': { pt: 'Pagamento recebido. Obrigado!', en: 'Payment received. Thank you!' },
  'dash.paidBody': {
    pt: 'O teu plano é ativado em poucos segundos. Os modelos novos deixam de ter marca de água. Recebes o recibo por email da Stripe.',
    en: 'Your plan activates in a few seconds. New models will no longer have a watermark. Stripe will email you the receipt.',
  },
  'dash.usage': { pt: 'modelos este mês', en: 'models this month' },

  // ---- Cartao de modelo ----
  'card.created': { pt: 'Criado em', en: 'Created on' },
  'card.expires': { pt: 'Expira em', en: 'Expires in' },
  'card.days': { pt: 'dias', en: 'days' },
  'card.view': { pt: 'Ver modelo', en: 'View model' },
  'card.progress': { pt: 'Ver progresso', en: 'View progress' },
  'card.delete': { pt: 'Apagar modelo', en: 'Delete model' },

  // ---- Estados ----
  'status.pending': { pt: 'A aguardar', en: 'Queued' },
  'status.extracting': { pt: 'A extrair', en: 'Extracting' },
  'status.processing': { pt: 'A processar', en: 'Processing' },
  'status.done': { pt: 'Pronto', en: 'Ready' },
  'status.error': { pt: 'Erro', en: 'Error' },

  // ---- Upload ----
  'up.title': { pt: 'Novo modelo 3D', en: 'New 3D model' },
  'up.subtitle': {
    pt: 'Carrega 4 a 6 fotos do teu produto e geramos um modelo 3D fotorrealista.',
    en: 'Upload 4 to 6 photos of your product and we generate a photorealistic 3D model.',
  },
  'up.sampleTitle': { pt: 'Ainda não tens fotos?', en: 'No photos yet?' },
  'up.sampleBody': {
    pt: 'Experimenta com um produto de demonstração e vê o resultado em minutos.',
    en: 'Try it with a demo product and see the result in minutes.',
  },
  'up.sampleBtn': { pt: 'Usar fotos de exemplo', en: 'Use sample photos' },
  'up.sampleLoading': { pt: 'A carregar...', en: 'Loading...' },
  'up.sampleName': { pt: 'Sapato (exemplo)', en: 'Shoe (sample)' },
  'up.nameLabel': { pt: 'Nome do produto', en: 'Product name' },
  'up.namePlaceholder': { pt: 'Ex: Ténis de corrida', en: 'e.g. Running shoe' },
  'up.pickPhotos': { pt: 'Clica para escolher 4 a 6 fotos', en: 'Click to choose 4 to 6 photos' },
  'up.pickHint': { pt: 'Vários ângulos do mesmo produto · JPG, PNG ou WEBP', en: 'Several angles of the same product · JPG, PNG or WEBP' },
  'up.selected1': { pt: 'foto selecionada', en: 'photo selected' },
  'up.selectedN': { pt: 'fotos selecionadas', en: 'photos selected' },
  'up.changeSelection': { pt: 'Clica para mudar a seleção', en: 'Click to change selection' },
  'up.onePhotoHint': {
    pt: 'Só 1 foto funciona, mas com 4-6 fotos de ângulos diferentes o modelo fica muito melhor.',
    en: 'One photo works, but 4-6 photos from different angles give a much better model.',
  },
  'up.submit': { pt: 'Gerar modelo 3D →', en: 'Generate 3D model →' },
  'up.sending': { pt: 'A enviar...', en: 'Uploading...' },
  'up.errName': { pt: 'Dá um nome ao produto.', en: 'Give the product a name.' },
  'up.errNoPhotos': { pt: 'Carrega pelo menos 1 foto.', en: 'Upload at least 1 photo.' },
  'up.errMax': { pt: 'Máximo 6 fotos.', en: 'Maximum 6 photos.' },
  'up.errUpload': { pt: 'Erro ao fazer upload.', en: 'Upload failed.' },
  'up.errSample': { pt: 'Não foi possível carregar as fotos de exemplo.', en: 'Could not load the sample photos.' },

  // ---- Guia de fotos ----
  'guide.title': { pt: '📷 Como tirar as fotos perfeitas', en: '📷 How to take perfect photos' },
  'guide.intro': {
    pt: 'Tira 4 a 6 fotos do mesmo produto, dando a volta. Quanto melhores as fotos, melhor o modelo 3D.',
    en: 'Take 4 to 6 photos of the same product, walking around it. The better the photos, the better the 3D model.',
  },
  'guide.front': { pt: 'Frente', en: 'Front' },
  'guide.left': { pt: 'Lado esq.', en: 'Left side' },
  'guide.right': { pt: 'Lado dir.', en: 'Right side' },
  'guide.back': { pt: 'Trás', en: 'Back' },
  'guide.top': { pt: 'De cima', en: 'From above' },
  'guide.bottom': { pt: 'De baixo', en: 'From below' },
  'guide.examples': { pt: 'Exemplos: à esquerda o certo ✓, à direita o errado ✕', en: 'Examples: correct on the left ✓, wrong on the right ✕' },
  'guide.egBig': { pt: 'Produto grande e centrado', en: 'Product large and centred' },
  'guide.egSmall': { pt: 'Produto pequeno e ao canto', en: 'Product small and off-centre' },
  'guide.egPlain': { pt: 'Fundo simples e liso', en: 'Plain, simple background' },
  'guide.egBusy': { pt: 'Fundo confuso', en: 'Cluttered background' },
  'guide.egSharp': { pt: 'Foto nítida e focada', en: 'Sharp, in-focus photo' },
  'guide.egBlur': { pt: 'Foto tremida ou desfocada', en: 'Shaky or blurred photo' },
  'guide.do': { pt: '✅ Faz', en: '✅ Do' },
  'guide.dont': { pt: '❌ Evita', en: '❌ Avoid' },
  'guide.do1': { pt: 'Fundo simples e liso (parede branca)', en: 'Plain, simple background (white wall)' },
  'guide.do2': { pt: 'Luz forte e difusa (sem sombras duras)', en: 'Strong, diffuse light (no harsh shadows)' },
  'guide.do3': { pt: 'Produto a ocupar mais de 70% da foto', en: 'Product filling more than 70% of the frame' },
  'guide.do4': { pt: 'Fotos nítidas e focadas', en: 'Sharp, in-focus photos' },
  'guide.do5': { pt: 'Mesma distância em todas as fotos', en: 'Same distance in every photo' },
  'guide.dont1': { pt: 'Fotos tremidas ou desfocadas', en: 'Shaky or blurred photos' },
  'guide.dont2': { pt: 'Objetos transparentes ou de vidro', en: 'Transparent or glass objects' },
  'guide.dont3': { pt: 'Superfícies muito brilhantes ou espelhadas', en: 'Very shiny or mirrored surfaces' },
  'guide.dont4': { pt: 'Fundos confusos ou com muitos objetos', en: 'Cluttered backgrounds' },
  'guide.dont5': { pt: 'Sombras fortes ou contraluz', en: 'Harsh shadows or backlight' },

  // ---- Pagina do modelo ----
  'model.back': { pt: 'Voltar ao dashboard', en: 'Back to dashboard' },
  'model.rename': { pt: 'Mudar o nome', en: 'Rename' },
  'model.dlGlb': { pt: 'Download .glb', en: 'Download .glb' },
  'model.dlObj': { pt: 'Download .obj', en: 'Download .obj' },
  'model.dlStl': { pt: 'Download .stl (impressão 3D)', en: 'Download .stl (3D printing)' },
  'model.realistic': { pt: '✨ Realista (cores e brilho reais)', en: '✨ Realistic (true colours and shine)' },
  'model.mesh': { pt: '🔷 Malha (para download / AR)', en: '🔷 Mesh (for download / AR)' },
  'model.errorTitle': { pt: 'Erro no processamento', en: 'Processing failed' },
  'model.errorBody': {
    pt: 'Verifica se as fotos estão nítidas, bem iluminadas e com fundo simples.',
    en: 'Check that the photos are sharp, well lit and have a simple background.',
  },
  'model.tryAgain': { pt: 'Tentar novamente', en: 'Try again' },
  'model.generating': { pt: 'A gerar modelo 3D...', en: 'Generating 3D model...' },
  'model.generatingHint': {
    pt: 'Costuma demorar 2-5 minutos. Esta página atualiza automaticamente.',
    en: 'Usually takes 2-5 minutes. This page updates automatically.',
  },
  'model.storeTitle': { pt: '🛒 Usar na tua loja', en: '🛒 Use it in your store' },
  'model.storeBody': {
    pt: 'Mostra este produto a rodar em 3D na tua loja online. Funciona em Shopify, WooCommerce, Wix ou qualquer site onde possas colar HTML.',
    en: 'Show this product rotating in 3D in your online store. Works with Shopify, WooCommerce, Wix or any site where you can paste HTML.',
  },
  'model.step1': { pt: 'Ativar a partilha', en: 'Enable sharing' },
  'model.step1Hint': {
    pt: 'Necessário para que os visitantes da tua loja consigam ver o modelo.',
    en: 'Required so visitors to your store can see the model.',
  },
  'model.step2': { pt: 'Copiar o código e colar na página do produto', en: 'Copy the code and paste it on your product page' },
  'model.copy': { pt: 'Copiar código', en: 'Copy code' },
  'model.copied': { pt: 'Copiado ✓', en: 'Copied ✓' },
  'model.preview': { pt: 'Pré-visualizar como o cliente vê →', en: 'Preview what customers see →' },
  'model.enableFirst': { pt: 'Ativa a partilha acima para obteres o código.', en: 'Enable sharing above to get the code.' },
  'model.watermark': { pt: 'criado com Snap3D', en: 'made with Snap3D' },
  'model.viewerError': { pt: 'Não foi possível carregar o modelo 3D', en: 'Could not load the 3D model' },
  'model.viewerErrorHint': { pt: 'O ficheiro pode estar corrompido ou em falta.', en: 'The file may be corrupted or missing.' },
  'model.splatError': { pt: 'Não foi possível carregar a vista realista', en: 'Could not load the realistic view' },
  'model.splatErrorHint': { pt: 'Tenta a vista de malha (GLB).', en: 'Try the mesh view (GLB).' },
  'model.splatLoading': { pt: 'A carregar vista realista...', en: 'Loading realistic view...' },
  'model.unavailable': { pt: 'Modelo não disponível', en: 'Model not available' },

  // ---- Precos (pagina) ----
  'plans.title': { pt: 'Preços simples', en: 'Simple pricing' },
  'plans.subtitle': { pt: 'Sem surpresas. Começa grátis, cancela quando quiseres.', en: 'No surprises. Start free, cancel anytime.' },
  'plans.download': { pt: 'Download:', en: 'Download:' },
  'plans.stripeNote': {
    pt: 'Pagamentos processados de forma segura por Stripe. Cancela a qualquer momento.',
    en: 'Payments securely processed by Stripe. Cancel anytime.',
  },
  'plans.wmFree': { pt: 'Com marca de água Snap3D', en: 'With Snap3D watermark' },
  'plans.wmPaid': { pt: 'Sem marca de água', en: 'No watermark' },
  'plans.f.models3': { pt: '3 modelos/mês', en: '3 models/month' },
  'plans.f.models25': { pt: '25 modelos/mês', en: '25 models/month' },
  'plans.f.unlimited': { pt: 'Modelos ilimitados', en: 'Unlimited models' },
  'plans.f.exp30': { pt: 'Modelos expiram em 30 dias', en: 'Models expire after 30 days' },
  'plans.f.exp90': { pt: 'Modelos guardados 90 dias', en: 'Models kept for 90 days' },
  'plans.f.expNever': { pt: 'Guardados para sempre', en: 'Kept forever' },
  'plans.f.photos': { pt: 'Até 6 fotos por modelo', en: 'Up to 6 photos per model' },
  'plans.f.quality': { pt: 'Modelos 3D fotorrealistas', en: 'Photorealistic 3D models' },
  'plans.f.queue': { pt: 'Fila prioritária', en: 'Priority queue' },
  'plans.f.queueMax': { pt: 'Fila máxima prioritária', en: 'Highest priority queue' },
  'plans.f.commercial': { pt: 'Uso comercial', en: 'Commercial use' },
  'plans.cta.free': { pt: 'Começar grátis', en: 'Start free' },
  'plans.cta.creator': { pt: 'Subscrever Creator', en: 'Subscribe to Creator' },
  'plans.cta.pro': { pt: 'Subscrever Pro', en: 'Subscribe to Pro' },
  'plans.month': { pt: '/mês', en: '/mo' },
  'plans.checkoutOpening': { pt: 'A abrir checkout...', en: 'Opening checkout...' },
  'plans.checkoutError': { pt: 'Erro ao iniciar pagamento.', en: 'Could not start payment.' },

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
  'benefits.real.desc': { pt: 'Tecnologia de última geração que captura cores e brilho reais — qualidade de e-commerce.', en: 'State-of-the-art technology that captures real colors and shine — e-commerce quality.' },
  'benefits.phone.title': { pt: 'Só precisas do telemóvel', en: 'Just your phone' },
  'benefits.phone.desc': { pt: 'Sem scanners caros nem software técnico. Bastam fotos normais do produto.', en: 'No expensive scanners or technical software. Just regular product photos.' },

  // How it works
  'how.title': { pt: 'Como funciona', en: 'How it works' },
  'how.s1.title': { pt: 'Tira as fotos', en: 'Take the photos' },
  'how.s1.desc': { pt: 'Fotografa o produto de 4 a 6 ângulos diferentes. Temos um guia visual para te ajudar a tirar fotos perfeitas.', en: 'Photograph the product from 4 to 6 different angles. We have a visual guide to help you take perfect photos.' },
  'how.s2.title': { pt: 'Geramos o modelo 3D', en: 'We generate the 3D' },
  'how.s2.desc': { pt: 'Combinamos as fotos e reconstruímos o produto em 3D, com texturas e cores reais.', en: 'We combine the photos and reconstruct the product in 3D, with real textures and colors.' },
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
  'faq.a5': { pt: 'Produtos sólidos e foscos, bem iluminados, com fundo simples. Objetos transparentes ou muito brilhantes são mais difíceis de reconstruir.', en: 'Solid, matte products, well lit, with a simple background. Transparent or very shiny objects are harder to reconstruct.' },
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
    // Guardar no perfil, para os emails saírem no mesmo idioma do site.
    // Falha em silêncio se o utilizador não tiver sessão iniciada.
    const supabase = createClientComponentClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('user_profiles').update({ lang: l }).eq('id', data.user.id).then(() => {})
      }
    })
  }

  const t = (k: string) => dict[k]?.[lang] ?? dict[k]?.pt ?? k

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
