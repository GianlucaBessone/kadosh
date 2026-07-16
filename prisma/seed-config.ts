import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial app configurations...');

  const initialConfigs = [
    { key: 'maintenance_mode', value: 'false', type: 'BOOLEAN', label: 'Modo mantenimiento', category: 'GENERAL' },
    { key: 'maintenance_banner_show', value: 'false', type: 'BOOLEAN', label: 'Mostrar banner de mantenimiento', category: 'GENERAL' },
    { key: 'maintenance_banner_text', value: '', type: 'STRING', label: 'Texto del banner', category: 'GENERAL' },
    { key: 'donations_enabled', value: 'false', type: 'BOOLEAN', label: 'Habilitar donaciones', category: 'MODULES' },
    { key: 'nps_enabled', value: 'true', type: 'BOOLEAN', label: 'Habilitar encuestas NPS', category: 'MODULES' },
    { key: 'notifications_enabled', value: 'true', type: 'BOOLEAN', label: 'Habilitar notificaciones (Push)', category: 'MODULES' },
    { key: 'onboarding_enabled', value: 'true', type: 'BOOLEAN', label: 'Habilitar Onboarding / Tutorial', category: 'MODULES' },
    { key: 'daily_verse_enabled', value: 'true', type: 'BOOLEAN', label: 'Habilitar versículo diario', category: 'MODULES' },
    { key: 'prayer_enabled', value: 'true', type: 'BOOLEAN', label: 'Habilitar botón de oración', category: 'MODULES' },
    { key: 'developer_reveal_min_minutes', value: '5', type: 'NUMBER', label: 'Tiempo mín. revelar dev. (min)', category: 'SUPPORT' },
    { key: 'developer_reveal_max_minutes', value: '15', type: 'NUMBER', label: 'Tiempo máx. revelar dev. (min)', category: 'SUPPORT' },
    { key: 'welcome_text', value: '¡Bienvenido a KADOSH!', type: 'STRING', label: 'Texto de bienvenida', category: 'GENERAL' },
    { key: 'min_required_version', value: '0.1.0', type: 'STRING', label: 'Versión mínima requerida', category: 'SYSTEM' },
    { key: 'force_update', value: 'false', type: 'BOOLEAN', label: 'Forzar actualización', category: 'SYSTEM' },
    { key: 'privacy_policy_url', value: '', type: 'STRING', label: 'URL Política de privacidad', category: 'LINKS' },
    { key: 'terms_conditions_url', value: '', type: 'STRING', label: 'URL Términos y condiciones', category: 'LINKS' },
    { key: 'support_url', value: '', type: 'STRING', label: 'URL de Soporte', category: 'LINKS' },
    { key: 'support_email', value: 'bessone.gianluca@gmail.com', type: 'STRING', label: 'Email de Soporte', category: 'SUPPORT' },
    { key: 'support_whatsapp', value: '5493576512035', type: 'STRING', label: 'WhatsApp de Soporte', category: 'SUPPORT' },
    { key: 'developer_avatar_url', value: '', type: 'STRING', label: 'Foto del desarrollador (URL)', category: 'SUPPORT' },
  ];

  for (const config of initialConfigs) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  // Seeding initial admin
  const defaultAdminEmail = 'bessone.gianluca@gmail.com';
  await prisma.admin.upsert({
    where: { email: defaultAdminEmail },
    update: {},
    create: {
      email: defaultAdminEmail,
      name: 'Gianluca Bessone',
    },
  });

  console.log('App configurations seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
