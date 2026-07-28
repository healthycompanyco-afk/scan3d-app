'use client'
import LegalLayout from '@/components/LegalLayout'
import { LEGAL } from '@/lib/legal'
import { useI18n } from '@/lib/i18n'

export default function PrivacyPage() {
  const { lang } = useI18n()
  const pt = lang === 'pt'

  return (
    <LegalLayout title={pt ? 'Política de Privacidade' : 'Privacy Policy'}>
      {pt ? (
        <>
          <p>
            Esta política explica que dados pessoais o {LEGAL.serviceName} recolhe, porquê, e que
            direitos tens. O responsável pelo tratamento é {LEGAL.legalEntity} ({LEGAL.country}),
            contactável em <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
          </p>

          <h2>1. Que dados recolhemos</h2>
          <ul>
            <li><strong>Conta:</strong> email e, se usares o Google, o nome e email associados.</li>
            <li><strong>Conteúdo:</strong> as fotografias que carregas e os modelos 3D gerados.</li>
            <li><strong>Utilização:</strong> número de modelos criados, plano e datas.</li>
            <li><strong>Pagamento:</strong> tratado pela Stripe. Não guardamos dados de cartão.</li>
            <li><strong>Técnicos:</strong> registos de erro e segurança gerados pela infraestrutura.</li>
          </ul>

          <h2>2. Para que usamos os dados</h2>
          <ul>
            <li>Prestar o serviço (processar fotos, gerar e guardar modelos).</li>
            <li>Gerir a conta, planos e limites mensais.</li>
            <li>Processar pagamentos e subscrições.</li>
            <li>Enviar emails essenciais (boas-vindas, modelo pronto, avisos de conta).</li>
            <li>Garantir segurança e prevenir abuso.</li>
          </ul>

          <h2>3. Fundamento legal (RGPD)</h2>
          <ul>
            <li><strong>Execução do contrato:</strong> prestação do serviço e faturação.</li>
            <li><strong>Interesse legítimo:</strong> segurança, prevenção de abuso e melhoria do serviço.</li>
            <li><strong>Obrigação legal:</strong> conservação de registos fiscais.</li>
            <li><strong>Consentimento:</strong> comunicações opcionais, quando aplicável.</li>
          </ul>

          <h2>4. Subcontratantes</h2>
          <p>Usamos fornecedores que tratam dados por nossa conta:</p>
          <ul>
            <li><strong>Supabase</strong> — autenticação, base de dados e armazenamento.</li>
            <li><strong>Vercel</strong> e <strong>Render</strong> — alojamento da aplicação e da API.</li>
            <li><strong>Modal</strong> — processamento das imagens em GPU para gerar os modelos.</li>
            <li><strong>Stripe</strong> — pagamentos e gestão de subscrições.</li>
            <li><strong>Resend</strong> — envio de emails transacionais.</li>
            <li><strong>Google</strong> — autenticação, se optares por entrar com Google.</li>
          </ul>
          <p>
            Alguns destes fornecedores podem tratar dados fora do Espaço Económico Europeu. Nesses
            casos, as transferências assentam em cláusulas contratuais-tipo ou mecanismos
            equivalentes previstos no RGPD.
          </p>

          <h2>5. Quanto tempo guardamos</h2>
          <ul>
            <li><strong>Modelos e fotos:</strong> conforme o plano (ex.: 30 dias no gratuito, 90 dias no Creator); depois são eliminados.</li>
            <li><strong>Conta:</strong> enquanto a mantiveres ativa.</li>
            <li><strong>Faturação:</strong> pelo prazo legal aplicável.</li>
          </ul>

          <h2>6. Os teus direitos</h2>
          <p>
            Tens direito de acesso, retificação, apagamento, limitação, portabilidade e oposição ao
            tratamento dos teus dados. Podes exercê-los por email para{' '}
            <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. Podes também apagar
            modelos diretamente na aplicação e pedir a eliminação da conta.
          </p>
          <p>
            Se considerares que os teus direitos não foram respeitados, podes apresentar reclamação
            à autoridade de controlo (em Portugal, a CNPD).
          </p>

          <h2>7. Cookies</h2>
          <p>
            Usamos apenas armazenamento essencial no navegador para manter a sessão iniciada e
            guardar a tua preferência de idioma. Não usamos cookies de publicidade nem de
            rastreamento de terceiros.
          </p>

          <h2>8. Segurança</h2>
          <p>
            As comunicações são cifradas (HTTPS), o acesso aos teus dados exige autenticação e os
            ficheiros de origem ficam em armazenamento privado. Ainda assim, nenhum sistema é
            infalível; comunica-nos qualquer problema de segurança que detetes.
          </p>

          <h2>9. Menores</h2>
          <p>O serviço não se destina a menores de 18 anos.</p>

          <h2>10. Alterações</h2>
          <p>
            Podemos atualizar esta política. A data de última atualização está no topo desta página
            e alterações relevantes serão comunicadas.
          </p>
        </>
      ) : (
        <>
          <p>
            This policy explains what personal data {LEGAL.serviceName} collects, why, and what
            rights you have. The data controller is {LEGAL.legalEntity} ({LEGAL.country}),
            reachable at <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
          </p>

          <h2>1. Data we collect</h2>
          <ul>
            <li><strong>Account:</strong> email and, if you use Google, the associated name and email.</li>
            <li><strong>Content:</strong> the photos you upload and the 3D models generated.</li>
            <li><strong>Usage:</strong> number of models created, plan and dates.</li>
            <li><strong>Payment:</strong> handled by Stripe. We never store card details.</li>
            <li><strong>Technical:</strong> error and security logs generated by the infrastructure.</li>
          </ul>

          <h2>2. How we use it</h2>
          <ul>
            <li>Providing the service (processing photos, generating and storing models).</li>
            <li>Managing your account, plans and monthly limits.</li>
            <li>Processing payments and subscriptions.</li>
            <li>Sending essential emails (welcome, model ready, account notices).</li>
            <li>Ensuring security and preventing abuse.</li>
          </ul>

          <h2>3. Legal basis (GDPR)</h2>
          <ul>
            <li><strong>Contract:</strong> providing the service and billing.</li>
            <li><strong>Legitimate interest:</strong> security, abuse prevention and service improvement.</li>
            <li><strong>Legal obligation:</strong> retention of tax records.</li>
            <li><strong>Consent:</strong> optional communications, where applicable.</li>
          </ul>

          <h2>4. Processors</h2>
          <p>We rely on providers that process data on our behalf:</p>
          <ul>
            <li><strong>Supabase</strong> — authentication, database and storage.</li>
            <li><strong>Vercel</strong> and <strong>Render</strong> — application and API hosting.</li>
            <li><strong>Modal</strong> — GPU processing of images to generate models.</li>
            <li><strong>Stripe</strong> — payments and subscription management.</li>
            <li><strong>Resend</strong> — transactional email delivery.</li>
            <li><strong>Google</strong> — authentication, if you choose to sign in with Google.</li>
          </ul>
          <p>
            Some providers may process data outside the European Economic Area. Such transfers rely
            on standard contractual clauses or equivalent GDPR safeguards.
          </p>

          <h2>5. Retention</h2>
          <ul>
            <li><strong>Models and photos:</strong> per plan (e.g. 30 days on free, 90 days on Creator), then deleted.</li>
            <li><strong>Account:</strong> for as long as you keep it active.</li>
            <li><strong>Billing:</strong> for the legally required period.</li>
          </ul>

          <h2>6. Your rights</h2>
          <p>
            You have the right to access, rectify, erase, restrict, port and object to the
            processing of your data. Contact{' '}
            <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> to exercise them. You
            can also delete models directly in the app and request account deletion.
          </p>
          <p>
            If you believe your rights were not respected, you may lodge a complaint with your
            supervisory authority (in Portugal, CNPD).
          </p>

          <h2>7. Cookies</h2>
          <p>
            We only use essential browser storage to keep you signed in and remember your language
            preference. We do not use advertising or third-party tracking cookies.
          </p>

          <h2>8. Security</h2>
          <p>
            Traffic is encrypted (HTTPS), access to your data requires authentication, and source
            files are kept in private storage. No system is perfect — please report any security
            issue you find.
          </p>

          <h2>9. Minors</h2>
          <p>The service is not intended for people under 18.</p>

          <h2>10. Changes</h2>
          <p>
            We may update this policy. The last updated date is shown at the top of this page and
            material changes will be communicated.
          </p>
        </>
      )}
    </LegalLayout>
  )
}
