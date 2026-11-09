import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CurpService } from '../../core/services/curp';
import { CurpResult } from '../../shared/interfaces/curp-result.interface';

@Component({
  selector: 'app-curp',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    TagModule,
    MessageModule,
    ProgressSpinnerModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './curp.html',
  styleUrl: './curp.css',
})
export class Curp {
  private readonly curpService = inject(CurpService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly curpControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(18), Validators.maxLength(18)],
  });

  readonly isLoading = signal(false);
  readonly result = signal<CurpResult | null>(null);

  constructor() {
    // Permite llegar desde el generador con ?valor=XXXX y validar de inmediato.
    const value = inject(ActivatedRoute).snapshot.queryParamMap.get('valor');
    if (value) {
      this.curpControl.setValue(value);
      this.onInput();
      this.validate();
    }
  }

  get charCount(): number {
    return this.curpControl.value.length;
  }

  get isValidLength(): boolean {
    return this.charCount === 18;
  }

  onInput(): void {
    const raw = this.curpControl.value;
    // Strip spaces + special characters + convert to uppercase
    const sanitized = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 18);
    if (sanitized !== raw) {
      this.curpControl.setValue(sanitized, { emitEvent: false });
    }
    // Clear result when user edits the field
    if (this.result()) {
      this.result.set(null);
    }
  }

  validate(): void {
    if (!this.isValidLength || this.isLoading()) return;

    // La validación es local y síncrona: no hace falta simular espera.
    this.result.set(this.curpService.validate(this.curpControl.value));
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  openOfficialPortal(): void {
    window.open('https://www.gob.mx/curp/', '_blank');
  }

  async copyCurp(): Promise<void> {
    const curp = this.result()?.curp;
    if (!curp) return;

    try {
      await navigator.clipboard.writeText(curp);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'CURP copiada correctamente.',
      });
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al copiar.',
      });
      console.error('Failed to copy CURP: ', e);
    }
  }

  async shareCurp(): Promise<void> {
    const curp = this.result()?.curp;
    if (!curp) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi CURP',
          text: `CURP: ${curp}`,
        });
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Compartido correctamente.',
        });
      } catch (e) {
        // Ignorar error si el usuario cancela la acción
      }
    } else {
      // Fallback a copiar si Web Share API no está disponible
      await this.copyCurp();
    }
  }
}
