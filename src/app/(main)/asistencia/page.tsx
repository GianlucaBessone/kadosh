'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LifeBuoy, MessageCircle, Heart, Compass } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SupportForm } from '@/components/asistencia/SupportForm';
import { FeedbackForm } from '@/components/asistencia/FeedbackForm';
import { NPSForm } from '@/components/asistencia/NPSForm';
import { DonationSection } from '@/components/asistencia/DonationSection';
import { PrayerSection } from '@/components/asistencia/PrayerSection';
import { MissionSection } from '@/components/asistencia/MissionSection';
import { DeveloperCard } from '@/components/asistencia/DeveloperCard';

export default function AsistenciaPage() {
  const [supportModal, setSupportModal] = useState<{ isOpen: boolean; defaultType: string }>({
    isOpen: false,
    defaultType: 'QUESTION',
  });
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [npsModal, setNpsModal] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mt-2 mb-2">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <LifeBuoy className="w-7 h-7" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Asistencia
          </h1>
          <p className="text-sm text-muted-foreground">Ayuda, Contacto e Información</p>
        </div>
      </div>

      {/* 1. Obtener ayuda */}
      <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Obtener ayuda</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            ¿Necesitas ayuda con KADOSH, encontraste un error o tienes una idea para mejorar la aplicación? Estamos para ayudarte.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => setSupportModal({ isOpen: true, defaultType: 'BUG' })}
              className="w-full text-left p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              Reportar un problema
            </button>
            <button
              onClick={() => setSupportModal({ isOpen: true, defaultType: 'FEATURE' })}
              className="w-full text-left p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              Solicitar una nueva función
            </button>
            <button
              onClick={() => setSupportModal({ isOpen: true, defaultType: 'QUESTION' })}
              className="w-full text-left p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              Hacer una consulta
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Comentarios */}
      <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Cuéntanos qué piensas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Tu opinión nos ayuda a mejorar KADOSH.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => setFeedbackModal(true)}
              className="w-full text-left p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              Enviar comentario
            </button>
            <button
              onClick={() => setNpsModal(true)}
              className="w-full text-left p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              Calificar mi experiencia
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Donaciones */}
      <DonationSection />

      {/* 4. Orar por este proyecto */}
      <PrayerSection />

      {/* 5. Nuestra misión & Developer */}
      <MissionSection />

      {/* Modals */}
      <SupportForm
        isOpen={supportModal.isOpen}
        onClose={() => setSupportModal({ ...supportModal, isOpen: false })}
        defaultType={supportModal.defaultType}
      />
      <FeedbackForm
        isOpen={feedbackModal}
        onClose={() => setFeedbackModal(false)}
      />
      <NPSForm
        isOpen={npsModal}
        onClose={() => setNpsModal(false)}
      />
    </div>
  );
}
