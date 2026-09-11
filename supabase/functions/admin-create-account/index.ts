// Creates an auth user + profile row for a new admin or customer account.
// Must run server-side: it uses the service-role key to bypass RLS for the
// insert (profiles has no INSERT policy for regular clients) and to call
// the Auth admin API, which is never available with the anon key.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateAccountBody {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'customer'
  organization_id?: string
  organization_name?: string
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing authorization header' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Scoped to the caller's own JWT, so this only ever sees what the
    // caller's own RLS policies allow (their own profile row).
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()

    if (!caller) {
      return json({ error: 'Not authenticated' }, 401)
    }

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return json({ error: 'Only admins can create accounts' }, 403)
    }

    const body: CreateAccountBody = await req.json()
    const { email, password, full_name, role, organization_id, organization_name } = body

    if (!email || !password || !full_name || !role) {
      return json({ error: 'email, password, full_name and role are required' }, 400)
    }

    if (role !== 'admin' && role !== 'customer') {
      return json({ error: 'role must be "admin" or "customer"' }, 400)
    }

    // Service-role client: bypasses RLS, only reached after the admin check above.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    let finalOrgId: string | null = null

    if (role === 'customer') {
      if (organization_id) {
        finalOrgId = organization_id
      } else if (organization_name) {
        const { data: newOrg, error: orgError } = await adminClient
          .from('organizations')
          .insert({ name: organization_name })
          .select()
          .single()

        if (orgError) return json({ error: orgError.message }, 400)
        finalOrgId = newOrg.id
      } else {
        return json({ error: 'Customer accounts need organization_id or organization_name' }, 400)
      }
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError || !created.user) {
      return json({ error: createError?.message ?? 'Failed to create user' }, 400)
    }

    const { error: profileError } = await adminClient.from('profiles').insert({
      id: created.user.id,
      organization_id: finalOrgId,
      full_name,
      role,
    })

    if (profileError) {
      // Roll back the auth user so we don't leave an orphaned login with no profile.
      await adminClient.auth.admin.deleteUser(created.user.id)
      return json({ error: profileError.message }, 400)
    }

    return json({ id: created.user.id, email: created.user.email })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
