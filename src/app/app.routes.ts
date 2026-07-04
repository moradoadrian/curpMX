import { Routes } from '@angular/router';
import { Curp } from './features/curp/curp';
import { Rfc } from './features/rfc/rfc';
import { Scanner } from './features/scanner/scanner';
import { Settings } from './features/settings/settings';
import { Home } from './features/home/home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'curp', component: Curp },
  { path: 'rfc', component: Rfc },
  { path: 'scanner', component: Scanner },
  { path: 'settings', component: Settings },
  { path: '**', redirectTo: '' }
];