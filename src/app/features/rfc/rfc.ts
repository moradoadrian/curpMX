import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { RfcService } from '../../core/services/rfc';
import { RfcResult } from '../../shared/interfaces/rfc-result.interface';

@Component({
  selector: 'app-rfc',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    TagModule,
    MessageModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './rfc.html',
  styleUrl: './rfc.css',
})
export class Rfc {
  private readonly rfcService = inject(RfcService);
  private readonly router = inject(Router);

  readonly rfcControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(12), Validators.maxLength(13)],
  });

  readonly isLoading = signal(false);
  readonly result = signal<RfcResult | null>(null);

  constructor() {
    // Permite llegar desde el generador con ?valor=XXXX y validar de inmediato.
    const value = inject(ActivatedRoute).snapshot.queryParamMap.get('valor');
    if (value) {
      this.rfcControl.setValue(value);
      this.onInput();
      this.validate();
    }
  }

  get charCount(): number {
    return this.rfcControl.value.length;
  }

  get isValidLength(): boolean {
    const len = this.charCount;
    return len === 12 || len === 13;
  }

  onInput(): void {
    const raw = this.rfcControl.value;
    // Strip spaces + special characters (except & which is valid in moral person RFC) + convert to uppercase
    const sanitized = raw.replace(/[^A-Za-z0-9&Ññ]/g, '').toUpperCase().slice(0, 13);
    if (sanitized !== raw) {
      this.rfcControl.setValue(sanitized, { emitEvent: false });
    }
    // Clear result when user edits the field
    if (this.result()) {
      this.result.set(null);
    }
  }

  validate(): void {
    if (!this.isValidLength || this.isLoading()) return;

    // La validación es local y síncrona: no hace falta simular espera.
    this.result.set(this.rfcService.validate(this.rfcControl.value));
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
