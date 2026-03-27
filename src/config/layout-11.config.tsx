import { MenuConfig } from '@/config/types';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Users,
  User,
} from 'lucide-react';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Principal',
    children: [
      {
        title: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Educación',
    children: [
      {
        title: 'Cursos',
        path: '/courses',
        icon: BookOpen,
      },
      {
        title: 'Clases',
        path: '/classes',
        icon: GraduationCap,
      },
      {
        title: 'Calificaciones',
        path: '/gradebook',
        icon: ClipboardList,
      },
    ],
  },
  {
    title: 'Reportes',
    children: [
      {
        title: 'Analytics',
        path: '/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Administración',
    children: [
      {
        title: 'Usuarios',
        path: '/users',
        icon: Users,
      },
      {
        title: 'Perfil',
        path: '/profile',
        icon: User,
      },
    ],
  },
];

export const MENU_HEADER: MenuConfig = [
  {
    title: 'Dashboard',
    path: '/dashboard',
  },
  {
    title: 'Cursos',
    path: '/courses',
  },
  {
    title: 'Clases',
    path: '/classes',
  },
  {
    title: 'Analytics',
    path: '/analytics',
  },
];
