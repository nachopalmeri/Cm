import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/auth/supabase-server'

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const { Stripe } = await import('stripe')
  const stripe = new Stripe(stripeSecret, { apiVersion: '2026-05-27.dahlia' as any })

  const payload = await req.text()
  const signature = req.headers.get('stripe-signature') || ''

  let event: any
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.user_id
      if (!userId) break

      await supabase.from('profiles').update({
        plan: 'starter',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      }).eq('id', userId)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      await supabase.from('profiles').update({ plan: 'free' }).eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}