'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Cloud,
  Download,
  HandHeart,
  Leaf,
  LockKeyhole,
  PiggyBank,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Sprout,
  Wallet,
  WifiOff,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const navItems = [
  { label: 'Qué es', href: '#que-es' },
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'Funciones', href: '#funciones' },
  { label: 'Capturas', href: '#capturas' },
  { label: 'FAQ', href: '#faq' },
];

const benefits = [
  {
    icon: Wallet,
    title: 'Orden sin fricción',
    text: 'Registra ingresos, gastos, cuentas y movimientos en pocos toques, con una lectura clara de tu mes.',
  },
  {
    icon: HandHeart,
    title: 'Mayordomía consciente',
    text: 'Calcula diezmos, ofrendas y compromisos para separar cada recurso con intención.',
  },
  {
    icon: LockKeyhole,
    title: 'Cifrado de grado militar',
    text: 'Utilizamos estándares criptográficos internacionales para proteger tu gestión financiera. Solo tú tienes la llave de tu información.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacidad desde el inicio',
    text: 'PIN local, biometría compatible y sincronización opcional para que elijas tu nivel de respaldo.',
  },
];

const features = [
  { icon: BookOpen, label: 'Versículo diario', detail: 'Una guía breve para empezar tus decisiones financieras con paz.' },
  { icon: BarChart3, label: 'Resumen mensual', detail: 'Balance, ingresos, gastos, diezmo pendiente y semillas activas.' },
  { icon: Sprout, label: 'Semillas y metas', detail: 'Ahorros con propósito, progreso y sentido de crecimiento.' },
  { icon: Cloud, label: 'Sincronización opcional', detail: 'Vincula una cuenta cuando quieras respaldo y acceso multidispositivo.' },
  { icon: ScanFace, label: 'Acceso seguro', detail: 'PIN local y biometría cuando el dispositivo la soporte.' },
  { icon: PiggyBank, label: 'Planificación', detail: 'Compromisos, fechas y flujo financiero para anticiparte.' },
];

const screenshots = [
  {
    title: 'Inicio',
    eyebrow: 'Balance total',
    value: '$ 248.920,00',
    accent: 'text-primary',
    rows: ['Ingresos', 'Gastos', 'Diezmo', 'Semillas'],
  },
  {
    title: 'Semillas',
    eyebrow: 'Meta activa',
    value: '68%',
    accent: 'text-success',
    rows: ['Fondo familiar', 'Viaje', 'Generosidad', 'Emergencias'],
  },
  {
    title: 'Diezmo',
    eyebrow: 'Pendiente',
    value: '$ 18.400,00',
    accent: 'text-gold',
    rows: ['Calculado', 'Entregado', 'Historial', 'Notas'],
  },
];

const faqs = [
  {
    question: '¿KADOSH necesita internet para funcionar?',
    answer: 'No. La app está pensada para ser offline-first: puedes registrar y consultar datos desde el dispositivo. La nube es totalmente opcional.',
  },
  {
    question: '¿Dónde se guardan mis datos?',
    answer: 'Primero se guardan localmente en el dispositivo. Si eliges sincronizar, se vinculan a tu cuenta para tener un respaldo y acceder desde otros equipos.',
  },
  {
    question: '¿Puedo empezar sin crear una cuenta?',
    answer: 'Sí. Puedes configurar tu perfil y PIN local, usar la app offline de manera inmediata y decidir más adelante si quieres sincronizar en la nube.',
  },
  {
    question: '¿La aplicación tiene algún costo?',
    answer: 'No, KADOSH es y será siempre 100% gratuita. Solo habilitaremos una opción para recibir donativos voluntarios que nos ayuden con el mantenimiento.',
  },
  {
    question: '¿Qué pasa si olvido mi PIN?',
    answer: 'Si habilitaste la biometría, podrás entrar con ella. Si sincronizaste tu cuenta en la nube, podrás cerrar sesión y recuperarla volviendo a ingresar.',
  },
];

function AppPreview() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 top-[45rem] overflow-hidden sm:top-10 lg:inset-y-0 lg:left-[40%]"
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute left-1/2 top-0 w-[320px] -translate-x-1/2 rounded-[2rem] border border-foreground/10 bg-card/90 p-3 shadow-2xl shadow-foreground/10 backdrop-blur sm:top-20 md:w-[360px] lg:left-[58%] lg:top-24"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="rounded-[1.5rem] bg-background p-4">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Hola, Gian</p>
              <p className="text-lg font-semibold text-foreground">Tu administración en paz</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Leaf className="h-5 w-5" />
            </div>
          </div>

          <div className="mb-5 text-center">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Balance total</p>
            <p className="mt-1 text-4xl font-bold text-foreground">$ 248.920</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['Ingresos', '$ 312K', 'bg-success/10 text-success'],
              ['Gastos', '$ 82K', 'bg-destructive/10 text-destructive'],
              ['Diezmo', '$ 18K', 'bg-gold/10 text-gold'],
              ['Semillas', '4', 'bg-secondary/20 text-secondary-foreground'],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
                <span className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full ${color}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-base font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-xs font-semibold text-primary">Versículo del día</p>
            <p className="mt-1 text-sm leading-6 text-foreground/80">
              Administra con sabiduría lo que recibiste hoy.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute right-4 top-28 hidden rounded-2xl border border-gold/25 bg-card/80 px-4 py-3 shadow-xl shadow-foreground/5 backdrop-blur md:block"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      >
        <p className="text-xs font-medium text-muted-foreground">Próximo compromiso</p>
        <p className="text-sm font-semibold text-foreground">Alquiler - vence en 4 días</p>
      </motion.div>
    </motion.div>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <motion.div
      className="mx-auto mb-10 max-w-2xl text-center"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.55 }}
    >
      <p className="mb-3 text-xs font-bold uppercase text-primary">{eyebrow}</p>
      <h2 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{text}</p>
    </motion.div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/welcome" className="flex items-center gap-3" aria-label="KADOSH inicio">
            <Image src="/icon-192x192.png" alt="" width={36} height={36} className="rounded-xl" priority />
            <span className="text-sm font-bold uppercase text-foreground">KADOSH</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:inline-flex">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-95">
              Comenzar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section id="que-es" className="relative flex min-h-[1080px] items-start overflow-hidden px-4 pt-24 sm:min-h-[760px] sm:items-center sm:px-6 lg:min-h-[820px] lg:px-8">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,var(--background)_34%,rgba(250,249,247,0.76)_58%,rgba(250,249,247,0.18)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,var(--background)_0%,rgba(250,249,247,0)_100%)]" />
          <AppPreview />

          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <motion.div
              className="max-w-2xl pb-16 pt-10 sm:pb-80 lg:pb-10"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Leaf className="h-3.5 w-3.5" />
                Finanzas personales con propósito
              </div>
              <h1 className="max-w-xl text-5xl font-bold leading-[1.04] text-foreground sm:text-6xl lg:text-7xl">
                Administra con sabiduría. Vive con paz.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-foreground/75">
                KADOSH es una app de gestión de finanzas personales inspirada en principios bíblicos: registra movimientos,
                separa compromisos y cuida tus semillas en un entorno 100% privado y cifrado.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/registro" className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-transform active:scale-95">
                  Descargar / Comenzar
                  <Download className="h-4 w-4" />
                </Link>
                <a href="#datos" className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-muted">
                  Cómo protegemos tus datos
                  <LockKeyhole className="h-4 w-4 text-primary" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="beneficios" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Beneficios"
              title="Una forma más serena de mirar tu dinero"
              text="KADOSH reduce el ruido y transforma tus finanzas en decisiones pequeñas, visibles y consistentes."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.article
                    key={benefit.title}
                    className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.45, delay: index * 0.06 }}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{benefit.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{benefit.text}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="funciones" className="bg-card px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Funciones"
              title="Lo esencial para ordenar, apartar y avanzar"
              text="La experiencia está pensada para uso diario: clara, rápida, táctil y con microinteracciones que acompañan cada acción."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.label}
                    className="group flex items-start gap-4 rounded-2xl border border-border/70 bg-background p-5 transition-colors hover:border-primary/30 hover:bg-primary/5"
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.45, delay: index * 0.05 }}
                  >
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{feature.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.detail}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="datos" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55 }}
            >
              <p className="mb-3 text-xs font-bold uppercase text-primary">Datos y privacidad</p>
              <h2 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">Eres el único dueño de tu información</h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                KADOSH está construida bajo una arquitectura de conocimiento cero. Tus datos se protegen con cifrado de extremo a extremo. No necesitas entender de criptografía; solo necesitas saber que tus finanzas permanecen estrictamente privadas.
              </p>
            </motion.div>
            <motion.div
              className="grid gap-4 sm:grid-cols-3"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              {[
                ['PIN local', 'El acceso diario se desbloquea con un PIN creado en el dispositivo.', LockKeyhole],
                ['Biometría', 'Si el equipo lo soporta, puedes usar rostro o huella para entrar más rápido.', ScanFace],
                ['Sincronización segura', 'Sincroniza de forma opcional para tener respaldo. Tus datos viajan y se guardan completamente cifrados.', Cloud],
              ].map(([title, text, Icon]) => (
                <div key={title as string} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/20 text-secondary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-foreground">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text as string}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="capturas" className="bg-foreground px-4 py-20 text-background sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="mb-3 text-xs font-bold uppercase text-secondary">Capturas</p>
                <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">La app se siente simple porque todo está cerca</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-background/70">
                Vistas pensadas para el celular: lectura rápida, botones táctiles, estados claros y movimientos suaves.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {screenshots.map((screen, index) => (
                <motion.div
                  key={screen.title}
                  className="rounded-[2rem] border border-background/10 bg-background p-3 text-foreground shadow-2xl shadow-black/20"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <div className="rounded-[1.5rem] bg-card p-5">
                    <div className="mb-6 flex items-center justify-between">
                      <p className="font-bold">{screen.title}</p>
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{screen.eyebrow}</p>
                    <p className={`mt-2 text-4xl font-bold ${screen.accent}`}>{screen.value}</p>
                    <div className="mt-6 space-y-3">
                      {screen.rows.map((row, rowIndex) => (
                        <div key={row} className="flex items-center justify-between rounded-2xl bg-muted/70 px-4 py-3">
                          <span className="text-sm font-medium">{row}</span>
                          <span className="h-2 w-14 rounded-full bg-primary/20">
                            <span className="block h-2 rounded-full bg-primary" style={{ width: `${38 + rowIndex * 14}%` }} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="gratis" className="px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto flex max-w-4xl flex-col items-center rounded-[2rem] bg-secondary/10 px-8 py-14 text-center sm:px-16"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <HandHeart className="h-7 w-7" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
              100% Gratuita, siempre.
            </h2>
            <p className="mb-8 max-w-2xl text-base leading-7 text-muted-foreground">
              Hemos creado KADOSH como una herramienta para bendecir la administración y economía de muchos. No tiene costo de descarga, ni suscripciones obligatorias.
            </p>
            <div className="rounded-xl border border-secondary/20 bg-background/60 px-6 py-4 text-sm font-medium italic text-foreground/80 shadow-sm">
              "Cada uno ponga al servicio de los demás el don que ha recibido, administrando fielmente la gracia de Dios en sus diversas formas."
              <span className="mt-2 block text-xs not-italic font-bold uppercase text-secondary">— 1 Pedro 4:10</span>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              En el futuro habilitaremos una sección opcional para quienes deseen apoyar el mantenimiento del proyecto mediante donativos voluntarios.
            </p>
          </motion.div>
        </section>

        <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionHeader
              eyebrow="Preguntas frecuentes"
              title="Antes de comenzar"
              text="Respuestas cortas para entender cómo funciona KADOSH y qué esperar del primer uso."
            />
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <motion.details
                  key={faq.question}
                  className="group rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                >
                  <summary className="cursor-pointer list-none text-base font-bold text-foreground marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {faq.question}
                      <ArrowRight className="h-4 w-4 flex-none text-primary transition-transform group-open:rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </motion.details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] border border-primary/20 bg-primary/10 px-6 py-12 text-center shadow-sm"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55 }}
          >
            <Image src="/icon-192x192.png" alt="" width={58} height={58} className="mb-5 rounded-2xl" />
            <h2 className="max-w-2xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">Empieza hoy con una administración más intencional</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Crea tu PIN local, registra tu primer movimiento y deja que KADOSH te acompañe en el orden diario.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/registro" className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-transform active:scale-95">
                Descargar / Comenzar
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex h-13 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-muted">
                Iniciar sesión
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}


