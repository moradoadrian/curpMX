import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { GeneratedDocuments, Gender, GeneratorService } from '../../core/services/generator';
import { MEXICAN_STATES } from '../../shared/constants/mexican-states';

/** Solo letras (incluye acentos, Ñ, Ü), espacios, apóstrofo, punto y guion. */
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/;

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  const date = parseIsoDate(value);
  if (!date) return { invalidDate: true };
  if (date.getTime() > Date.now()) return { futureDate: true };
  if (date.getFullYear() < 1900) return { tooOld: true };
  return null;
}

/** Convierte "AAAA-MM-DD" a fecha local sin desfase de zona horaria. */
function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

@Component({
  selector: 'app-generator',
  imports: [ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './generator.html',
  styleUrl: './generator.css',
})
export class Generator {
  private readonly generator = inject(GeneratorService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly states = Object.entries(MEXICAN_STATES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => (a.code === 'NE' ? 1 : b.code === 'NE' ? -1 : a.name.localeCompare(b.name)));

  readonly genders: { value: Gender; label: string }[] = [
    { value: 'H', label: 'Hombre' },
    { value: 'M', label: 'Mujer' },
    { value: 'X', label: 'No binario' },
  ];

  /** Fecha local de hoy en formato AAAA-MM-DD (límite del selector de fecha). */
  readonly today = (() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  readonly form = new FormGroup({
    names: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(NAME_PATTERN)],
    }),
    firstSurname: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(NAME_PATTERN)],
    }),
    secondSurname: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(NAME_PATTERN)],
    }),
    birthDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, pastDateValidator],
    }),
    gender: new FormControl<Gender | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    stateCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly result = signal<GeneratedDocuments | null>(null);

  constructor() {
    // Si el usuario edita el formulario, el resultado anterior deja de ser válido.
    this.form.valueChanges.subscribe(() => this.result.set(null));
  }

  showError(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  dateError(): string {
    const errors = this.form.controls.birthDate.errors;
    if (errors?.['required']) return 'La fecha de nacimiento es obligatoria.';
    if (errors?.['futureDate']) return 'La fecha no puede estar en el futuro.';
    if (errors?.['tooOld']) return 'La fecha debe ser posterior a 1900.';
    return 'Fecha no válida.';
  }

  generate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.result.set(
      this.generator.generate({
        names: value.names,
        firstSurname: value.firstSurname,
        secondSurname: value.secondSurname,
        birthDate: parseIsoDate(value.birthDate)!,
        gender: value.gender as Gender,
        stateCode: value.stateCode,
      }),
    );
  }

  reset(): void {
    this.form.reset();
    this.result.set(null);
  }

  async copy(value: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.messageService.add({ severity: 'success', summary: 'Copiado', detail: `${label} copiado.` });
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo copiar.' });
    }
  }

  validateIn(route: 'curp' | 'rfc', value: string): void {
    this.router.navigate(['/' + route], { queryParams: { valor: value } });
  }

  compareResult(res: GeneratedDocuments): void {
    this.router.navigate(['/comparar'], { queryParams: { curp: res.curp, rfc: res.rfc } });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
