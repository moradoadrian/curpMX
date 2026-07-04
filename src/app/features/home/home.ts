import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from '../../shared/interfaces/menu-item.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RippleModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly menuItems: MenuItem[] = [
    {
      title: 'Validar CURP',
      description: 'Valida el formato y obtén información de una CURP.',
      icon: 'pi pi-id-card',
      route: '/curp',
    },
    {
      title: 'Validar RFC',
      description: 'Verifica el formato de un RFC.',
      icon: 'pi pi-file',
      route: '/rfc',
    },
    {
      title: 'Escanear Documento',
      description: 'Escanea automáticamente una CURP o RFC.',
      icon: 'pi pi-camera',
      route: '/scanner',
      disabled: true,
      badge: 'Próximamente',
    },
    {
      title: 'Configuración',
      description: 'Personaliza la aplicación.',
      icon: 'pi pi-cog',
      route: '/settings',
    },
  ];

  constructor(private router: Router) {}

  navigate(item: MenuItem): void {
    if (!item.disabled) {
      this.router.navigate([item.route]);
    }
  }
}
