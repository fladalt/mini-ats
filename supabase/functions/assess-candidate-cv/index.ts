// Runs a lightweight AI fit assessment on a candidate's pasted CV text
// against the job they applied to. Deliberately reuses the caller's own
// JWT (not the service-role key) for every database read/write here: if
// the caller's RLS policies wouldn't let them see or edit this candidate,
// this function can't either, so no separate authorization logic is needed.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return json({ error: 'ANTHROPIC_API_KEY is not configured on this project' }, 500)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { candidate_id } = await req.json()
    if (!candidate_id) {
      return json({ error: 'candidate_id is required' }, 400)
    }

    const { data: candidate, error: candidateError } = await client
      .from('candidates')
      .select('id, full_name, resume_text, job_id')
      .eq('id', candidate_id)
      .single()

    if (candidateError || !candidate) {
      return json({ error: 'Candidate not found or not accessible' }, 404)
    }

    if (!candidate.resume_text) {
      return json({ error: 'This candidate has no CV text to assess' }, 400)
    }

    const { data: job } = await client
      .from('jobs')
      .select('title, description')
      .eq('id', candidate.job_id)
      .single()

    const prompt = `You are screening a candidate for a job. Respond with ONLY a JSON object of the form {"score": <0-100 integer>, "summary": "<2-3 sentence summary of fit>"}. No other text.

Job title: ${job?.title ?? 'Unknown'}
Job description: ${job?.description ?? 'No description provided.'}

Candidate CV:
${candidate.resume_text}`

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      return json({ error: `AI request failed: ${errText}` }, 502)
    }

    const aiData = await aiResponse.json()
    const text: string = aiData.content?.[0]?.text ?? ''

    let score: number
    let summary: string

    try {
      const match = text.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(match ? match[0] : text)
      score = Math.max(0, Math.min(100, Math.round(parsed.score)))
      summary = String(parsed.summary)
    } catch {
      return json({ error: 'Could not parse AI response' }, 502)
    }

    const assessedAt = new Date().toISOString()

    const { error: updateError } = await client
      .from('candidates')
      .update({ ai_score: score, ai_summary: summary, ai_assessed_at: assessedAt })
      .eq('id', candidate_id)

    if (updateError) {
      return json({ error: updateError.message }, 400)
    }

    return json({ score, summary, assessed_at: assessedAt })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
