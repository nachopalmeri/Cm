import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/supabase-server'

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const { Stripe } = await import('stripe')
  const stripe = new Stripe(stripeSecret, { apiVersion: '2026-05-27.dahlia' as any })

  const PRICE_MAP: Record<string, string> = {
    starter: process.env.STRIPE_PRICE_STARTER || '',
    pro: process.env.STRIPE_PRICE_PRO || '',
  }

  try {
    const { plan } = await req.json()
    const priceId = PRICE_MAP[plan]
    if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.get('origin') || 'https://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${req.headers.get('origin') || 'https://localhost:3000'}/dashboard?canceled=true`,
      metadata: { user_id: userId },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}