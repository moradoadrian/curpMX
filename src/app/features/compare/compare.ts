import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CompareResult, CompareService, CompareStatus } from '../../core/services/compare';

const STATUS_VIEW: Record<CompareStatus, { title: string; icon: string; color: string }> = {
  match: { title: 'Coinciden', icon: 'pi pi-check-circle', color: 'text-primary-800' },
  probable: { title: 'Coincidencia probable', icon: 'pi pi-info-circle', color: 'text-amber-600' },
  mismatch: { title: 'No coinciden', icon: 'pi pi-times-circle', color: 'text-red-500' },
  invalid: { title: 'Datos inválidos', icon: 'pi pi-exclamation-triangle', color: 'text-red-500' },
};

@Component({
  selector: 'app-compare',
  imports: [ReactiveFormsModule],
  templateUrl: './compare.html',
  styleUrl: './compare.css',
})
export class Compare {
  private readonly compareService = inject(CompareService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    curp: new FormControl('', { nonNullable: true }),
    rfc: new FormControl('', { nonNullable: true }),
  });

  readonly result = signal<CompareResult | null>(null);

  /** Etiquetas de las 10 posiciones comparadas. */
  readonly segments = [
    { label: 'Iniciales', from: 0, to: 4 },
    { label: 'Año', from: 4, to: 6 },
    { label: 'Mes', from: 6, to: 8 },
    { label: 'Día', from: 8, to: 10 },
  ];

  constructor() {
    // Llegada desde el generador: /comparar?curp=...&rfc=...
    const params = inject(ActivatedRoute).snapshot.queryParamMap;
    const curp = params.get('curp');
    const rfc = params.get('rfc');
    if (curp || rfc) {
      this.form.setValue({ curp: this.sanitize(curp ?? '', 18), rfc: this.sanitize(rfc ?? '', 13) });
      if (this.canCompare) this.compare();
    }
  }

  get canCompare(): boolean {
    const { curp, rfc } = this.form.getRawValue();
    return curp.length === 18 && (rfc.length === 12 || rfc.length === 13);
  }

  view(status: CompareStatus) {
    return STATUS_VIEW[status];
  }

  onInput(field: 'curp' | 'rfc'): void {
    const control = this.form.controls[field];
    const clean = this.sanitize(control.value, field === 'curp' ? 18 : 13);
    if (clean !== control.value) control.setValue(clean, { emitEvent: false });
    this.result.set(null);
  }

  compare(): void {
    if (!this.canCompare) return;
    const { curp, rfc } = this.form.getRawValue();
    this.result.set(this.compareService.compare(curp, rfc));
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  private sanitize(value: string, max: number): string {
    return value.toUpperCase().replace(/[^A-Z0-9Ñ&]/g, '').slice(0, max);
  }
}
