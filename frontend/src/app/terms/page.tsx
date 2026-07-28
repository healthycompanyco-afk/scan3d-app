'use client'
import LegalLayout from '@/components/LegalLayout'
import { LEGAL } from '@/lib/legal'
import { useI18n } from '@/lib/i18n'

export default function TermsPage() {
  const { lang } = useI18n()
  const pt = lang === 'pt'

  return (
    <LegalLayout title={pt ? 'Termos e Condições' : 'Terms of Service'}>
      {pt ? (
        <>
          <p>
            Estes termos regulam a utilização do serviço {LEGAL.serviceName} ({LEGAL.website}),
            operado por {LEGAL.legalEntity}, em {LEGAL.country}. Ao criar conta ou usar o serviço,
            aceitas estes termos.
          </p>

          <h2>1. O serviço</h2>
          <p>
            O {LEGAL.serviceName} permite gerar modelos 3D a partir de fotografias, usando
            inteligência artificial. Os resultados dependem da qualidade das fotos e podem não ser
            fiéis ao objeto real. O serviço é fornecido &quot;tal como está&quot;, sem garantia de
            resultado, precisão dimensional ou adequação a um fim específico.
          </p>

          <h2>2. Conta</h2>
          <ul>
            <li>Tens de ter pelo menos 18 anos ou autorização de um responsável legal.</li>
            <li>És responsável por manter as tuas credenciais seguras.</li>
            <li>Podemos suspender contas que violem estes termos ou a lei.</li>
          </ul>

          <h2>3. O que podes carregar</h2>
          <p>
            Garantes que tens direitos sobre as fotografias que carregas e que estas não violam
            direitos de terceiros nem a lei. É proibido carregar conteúdo ilegal, ofensivo, com
            dados pessoais de terceiros sem consentimento, ou material protegido por direitos de
            autor sem autorização.
          </p>

          <h2>4. Propriedade dos modelos</h2>
          <p>
            Mantém-se tua a propriedade das fotografias que carregas e dos modelos 3D gerados a
            partir delas. Concedes-nos apenas a licença técnica necessária para processar,
            armazenar e apresentar esse conteúdo dentro do serviço.
          </p>
          <p>
            No plano gratuito, os modelos são apresentados com marca de água {LEGAL.serviceName}.
            A utilização comercial está incluída no plano Pro.
          </p>

          <h2>5. Planos, pagamentos e cancelamento</h2>
          <ul>
            <li>O plano gratuito inclui um número limitado de modelos por mês.</li>
            <li>Os planos pagos são subscrições mensais, cobradas de forma recorrente via Stripe.</li>
            <li>Podes cancelar a qualquer momento; o acesso mantém-se até ao fim do período já pago.</li>
            <li>Salvo obrigação legal, não há reembolso de períodos já iniciados.</li>
            <li>Os preços podem ser alterados, com aviso prévio antes da renovação.</li>
          </ul>

          <h2>6. Retenção e expiração</h2>
          <p>
            Os modelos podem expirar e ser apagados conforme o plano (por exemplo, 30 dias no plano
            gratuito e 90 dias no plano Creator). Recomendamos que descarregues os ficheiros que
            queiras conservar.
          </p>

          <h2>7. Uso aceitável</h2>
          <p>
            Não é permitido tentar contornar limites de utilização, aceder a dados de outros
            utilizadores, sobrecarregar a infraestrutura, revender o serviço sem autorização, nem
            remover marcas de água de modelos gerados no plano gratuito.
          </p>

          <h2>8. Limitação de responsabilidade</h2>
          <p>
            Na máxima medida permitida por lei, não somos responsáveis por perdas indiretas,
            perda de dados, lucros cessantes ou danos resultantes do uso — ou da impossibilidade de
            uso — do serviço. A nossa responsabilidade total está limitada ao valor pago por ti nos
            12 meses anteriores ao facto.
          </p>

          <h2>9. Disponibilidade</h2>
          <p>
            O serviço pode ter interrupções para manutenção ou por falhas de fornecedores externos.
            Podemos alterar ou descontinuar funcionalidades, comunicando alterações relevantes.
          </p>

          <h2>10. Lei aplicável</h2>
          <p>
            Aplica-se a lei portuguesa. Enquanto consumidor, mantens os direitos previstos na
            legislação de defesa do consumidor, incluindo o recurso a resolução alternativa de
            litígios.
          </p>

          <h2>11. Contacto</h2>
          <p>
            Dúvidas sobre estes termos: <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
          </p>
        </>
      ) : (
        <>
          <p>
            These terms govern the use of {LEGAL.serviceName} ({LEGAL.website}), operated by{' '}
            {LEGAL.legalEntity}, based in {LEGAL.country}. By creating an account or using the
            service, you accept these terms.
          </p>

          <h2>1. The service</h2>
          <p>
            {LEGAL.serviceName} generates 3D models from photographs using artificial intelligence.
            Results depend on photo quality and may not faithfully match the real object. The
            service is provided &quot;as is&quot;, without warranty of results, dimensional accuracy
            or fitness for a particular purpose.
          </p>

          <h2>2. Account</h2>
          <ul>
            <li>You must be at least 18 or have permission from a legal guardian.</li>
            <li>You are responsible for keeping your credentials secure.</li>
            <li>We may suspend accounts that violate these terms or the law.</li>
          </ul>

          <h2>3. What you may upload</h2>
          <p>
            You confirm you hold the rights to the photos you upload and that they do not infringe
            third-party rights or the law. Uploading illegal or offensive content, personal data of
            others without consent, or copyrighted material without permission is prohibited.
          </p>

          <h2>4. Ownership of models</h2>
          <p>
            You retain ownership of the photos you upload and of the 3D models generated from them.
            You grant us only the technical licence needed to process, store and display that
            content within the service.
          </p>
          <p>
            On the free plan, models are displayed with a {LEGAL.serviceName} watermark. Commercial
            use is included in the Pro plan.
          </p>

          <h2>5. Plans, payments and cancellation</h2>
          <ul>
            <li>The free plan includes a limited number of models per month.</li>
            <li>Paid plans are monthly subscriptions billed recurrently via Stripe.</li>
            <li>You may cancel at any time; access continues until the end of the paid period.</li>
            <li>Except where legally required, periods already started are non-refundable.</li>
            <li>Prices may change, with notice before renewal.</li>
          </ul>

          <h2>6. Retention and expiry</h2>
          <p>
            Models may expire and be deleted according to your plan (for example, 30 days on the
            free plan and 90 days on Creator). Please download any files you wish to keep.
          </p>

          <h2>7. Acceptable use</h2>
          <p>
            You may not attempt to bypass usage limits, access other users&apos; data, overload the
            infrastructure, resell the service without authorisation, or remove watermarks from
            models generated on the free plan.
          </p>

          <h2>8. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, we are not liable for indirect losses, data
            loss, lost profits or damages arising from the use — or inability to use — the service.
            Our total liability is limited to the amount you paid in the 12 months preceding the
            event.
          </p>

          <h2>9. Availability</h2>
          <p>
            The service may be interrupted for maintenance or due to third-party provider failures.
            We may change or discontinue features, communicating relevant changes.
          </p>

          <h2>10. Governing law</h2>
          <p>
            Portuguese law applies. As a consumer, you retain the rights granted by consumer
            protection legislation, including access to alternative dispute resolution.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions about these terms:{' '}
            <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
          </p>
        </>
      )}
    </LegalLayout>
  )
}
