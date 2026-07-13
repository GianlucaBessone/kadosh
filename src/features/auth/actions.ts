'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/home')
}

export async function register(formData: FormData) {
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const name = String(formData.get('name'))
  const lastName = String(formData.get('lastName'))
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        lastName,
      }
    }
  })

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/?message=Verifica tu correo electrónico para continuar.')
}

export async function loginWithGoogle() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (data.url) {
    redirect(data.url)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
