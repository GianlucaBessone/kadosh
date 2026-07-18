import { redirect } from 'next/navigation';

export default function Page() {
  // Cambiar redirección a home por login para evitar posibles problemas de redirección offline
  redirect('/login');
}