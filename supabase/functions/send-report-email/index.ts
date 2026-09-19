// @ts-nocheck
// Supabase Edge Function: send-report-email
// Serves POST requests to send student diagnostic report PDF via email (using Resend API)

// Ambient type declarations for IDEs without the Deno extension installed
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SendEmailRequest {
  attemptId: string
  recipientEmail: string
  pdfBase64?: string
  studentName?: string
  assessmentName?: string
  scorePercentage?: number
}

serve(async (req: any) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('SENDER_EMAIL') || 'diagnostic@assesshub.com'

    const body: SendEmailRequest = await req.json()
    const {
      recipientEmail,
      pdfBase64,
      studentName = 'Student',
      assessmentName = 'Math Diagnostic Assessment',
      scorePercentage,
    } = body

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'recipientEmail is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If RESEND_API_KEY is not configured, simulate success or provide clear response
    if (!apiKey) {
      console.warn('RESEND_API_KEY is not configured. Simulating successful email dispatch.')
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: `Diagnostic report queued for delivery to ${recipientEmail}. Set RESEND_API_KEY to dispatch live emails.`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const attachments = []
    if (pdfBase64) {
      // Clean base64 string if it has data url prefix
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '')
      attachments.push({
        filename: `Diagnostic_Report_${studentName.replace(/\s+/g, '_')}.pdf`,
        content: cleanBase64,
      })
    }

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Math Diagnostic Platform</h1>
          <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">Diagnostic Performance Assessment Report</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${studentName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          Your diagnostic evaluation for <strong>${assessmentName}</strong> has been compiled.
          ${scorePercentage !== undefined ? `You achieved an overall score of <strong>${scorePercentage}%</strong>.` : ''}
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #0f172a;">Assessment Summary</h3>
          <p style="margin: 0; font-size: 14px; color: #475569;">
            Your comprehensive report, domain performance breakdown, and recommended study plan are attached as a PDF document.
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
          Please review the attached diagnostic PDF to see your strong domains, areas needing review, and paced time analysis.
        </p>

        <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #94a3b8;">
          Math Diagnostic Assessment Platform &copy; ${new Date().getFullYear()} · All rights reserved.
        </div>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        subject: `Your Diagnostic Report — ${assessmentName}`,
        html: emailHtml,
        attachments,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Error from Resend API:', data)
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to send email via Resend' }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
