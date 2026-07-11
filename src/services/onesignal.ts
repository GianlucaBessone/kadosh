export async function sendNotification(userId: string, title: string, message: string) {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID, // Necesitarás configurar esto
        include_external_user_ids: [userId],
        headings: { en: title, es: title },
        contents: { en: message, es: message },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Error sending OneSignal notification:', data)
      return false
    }

    return true
  } catch (error) {
    console.error('Exception in sendNotification:', error)
    return false
  }
}
