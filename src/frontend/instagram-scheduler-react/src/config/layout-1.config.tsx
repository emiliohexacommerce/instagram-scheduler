import {
  Bot,
  Calendar,
  Instagram,
  LayoutDashboard,
  FileText,
  CreditCard,
  Layers,
} from 'lucide-react';
import { MenuConfig } from '@/config/types';

// Required by mega-menu components — empty for this app
export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];

export const MENU_SIDEBAR: MenuConfig = [
  {
    heading: 'Principal',
  },
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    heading: 'Gestión',
  },
  {
    title: 'Cuentas Sociales',
    icon: Instagram,
    path: '/accounts',
  },
  {
    title: 'Posts Programados',
    icon: FileText,
    path: '/posts',
  },
  {
    title: 'Calendario',
    icon: Calendar,
    path: '/calendar',
  },
  {
    heading: 'Herramientas',
  },
  {
    title: 'Caption con IA',
    icon: Bot,
    path: '/ai-caption',
  },
  {
    heading: 'Suscripción',
  },
  {
    title: 'Mi Suscripción',
    icon: CreditCard,
    path: '/subscription',
  },
  {
    title: 'Planes',
    icon: Layers,
    path: '/plans',
  },
];
