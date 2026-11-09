import { Routes } from '@angular/router';
import { Home } from './features/home/home';

/**
 * Inicio se carga de forma inmediata (es la primera pantalla).
 * El resto se descarga solo cuando el usuario navega a ella.
 */
export const routes: Routes = [
  { path: '', component: Home },
  { path: 'curp', loadComponent: () => import('./features/curp/curp').then((m) => m.Curp) },
  { path: 'rfc', loadComponent: () => import('./features/rfc/rfc').then((m) => m.Rfc) },
  {
    path: 'generar',
    loadComponent: () => import('./features/generator/generator').then((m) => m.Generator),
  },
  {
    path: 'comparar',
    loadComponent: () => import('./features/compare/compare').then((m) => m.Compare),
  },
  {
    path: 'scanner',
    loadComponent: () => import('./features/scanner/scanner').then((m) => m.Scanner),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
  },
  { path: '**', redirectTo: '' },
];
