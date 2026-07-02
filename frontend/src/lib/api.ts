import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * POST autenticado para o backend — envia o JWT do Supabase
 * no header Authorization (o backend valida quem é o utilizador).
 */
export async function apiPost(path: string, body: object = {}) {
  const supabase = createClientComponentClient()
  const { data: { session } } = await supabase.auth.getSession()
  return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}
