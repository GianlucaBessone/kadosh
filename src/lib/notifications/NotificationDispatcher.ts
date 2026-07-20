export const NotificationDispatcher = {
  dispatchPrayerJoined: async (targetUserId: string, prayerRequestId: string) => {
    // TODO (OneSignal): Implementar llamada a API de Push Notifications (OneSignal o Firebase)
    // Asunto: "Alguien se unió a tu petición de oración"
    // Cuerpo: "Tienes nuevos intercesores acompañando tu petición."
    console.log(`[NotificationDispatcher] dispatchPrayerJoined -> userId: ${targetUserId}, reqId: ${prayerRequestId}`);
  },

  dispatchPrayerPrayed: async (targetUserId: string, prayerRequestId: string) => {
    // TODO (OneSignal): Implementar llamada a API de Push Notifications
    // Asunto: "Alguien está orando por ti"
    // Cuerpo: "Una persona de la comunidad levantó una oración por tu necesidad."
    console.log(`[NotificationDispatcher] dispatchPrayerPrayed -> userId: ${targetUserId}, reqId: ${prayerRequestId}`);
  },

  dispatchPrayerCancelled: async (joinedUserIds: string[], prayerRequestId: string) => {
    // TODO (OneSignal): Implementar llamada a API de Push Notifications para un array de usuarios
    // Asunto: "Petición finalizada"
    // Cuerpo: "Una petición que acompañabas ha sido cancelada o finalizada."
    console.log(`[NotificationDispatcher] dispatchPrayerCancelled -> a ${joinedUserIds.length} usuarios, reqId: ${prayerRequestId}`);
  }
};
