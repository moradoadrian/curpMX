import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

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
  ],
  templateUrl: './curp.html',
  styleUrl: './curp.css',
})
export class Curp {
  private readonly curpService = inject(CurpService);
  private readonly router = inject(Router);

  readonly curpControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(18), Validators.maxLength(18)],
  });

  readonly isLoading = signal(false);
  readonly result = signal<CurpResult | null>(null);

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

    this.isLoading.set(true);
    this.result.set(null);

    // Simulated 1s processing delay
    setTimeout(() => {
      const curpResult = this.curpService.validate(this.curpControl.value);
      this.result.set(curpResult);
      this.isLoading.set(false);
    }, 1000);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
