import { Injectable } from '@angular/core';
import { CurpResult } from '../../shared/interfaces/curp-result.interface';
import { MEXICAN_STATES } from '../../shared/constants/mexican-states';

/**
 * CurpService — Arquitectura preparada para integrar el algoritmo oficial.
 *
 * Todos los métodos devuelven datos simulados por ahora.
 * La lógica de validación real se integrará sin modificar la interfaz pública.
 */
@Injectable({
  providedIn: 'root',
})
export class CurpService {

  /**
   * Valida una CURP completa y devuelve un CurpResult.
   * TODO: Implementar algoritmo oficial de validación RENAPO.
   */
  validate(curp: string): CurpResult {
    const upper = curp.trim().toUpperCase();

    if (upper.length !== 18) {
      return this.invalidResult(upper, 'Longitud incorrecta. La CURP debe tener exactamente 18 caracteres.');
    }

    // TODO: Validate pattern with official regex
    const pattern = /^[A-Z]{4}\d{6}[HM][A-Z]{2}[A-Z]{3}\d{2}$/;
    if (!pattern.test(upper)) {
      return this.invalidResult(upper, 'Formato inválido. Verifica que la CURP contenga los caracteres correctos.');
    }

    const stateCode = upper.substring(11, 13);
    if (!MEXICAN_STATES[stateCode]) {
      return this.invalidResult(upper, `Estado "${stateCode}" no reconocido.`);
    }

    // TODO: Validate birth date range
    // TODO: Implement checksum verifier (calculateVerifier)
    // Returning simulated valid result for now
    return {
      valid: true,
      curp: upper,
      birthDate: this.getBirthDate(upper),
      age: this.getAge(upper),
      gender: this.getGender(upper),
      state: this.getState(upper),
      verifierValid: true, // TODO: replace with calculateVerifier result
      message: 'CURP válida.',
    };
  }

  /**
   * Extrae la fecha de nacimiento de la CURP.
   * TODO: Handle century logic (1900 vs 2000).
   */
  getBirthDate(curp: string): string {
    // Positions 4-9: AAMMDD
    const yy = curp.substring(4, 6);
    const mm = curp.substring(6, 8);
    const dd = curp.substring(8, 10);
    // TODO: Determine century from verifier digit
    const year = parseInt(yy, 10) <= 25 ? `20${yy}` : `19${yy}`;
    return `${dd}/${mm}/${year}`;
  }

  /**
   * Calcula la edad a partir de la fecha de nacimiento extraída.
   * TODO: Refine with full date parsing.
   */
  getAge(curp: string): number {
    const yy = parseInt(curp.substring(4, 6), 10);
    const mm = parseInt(curp.substring(6, 8), 10);
    const dd = parseInt(curp.substring(8, 10), 10);
    const birthYear = yy <= 25 ? 2000 + yy : 1900 + yy;
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const hasBirthdayPassed =
      today.getMonth() + 1 > mm ||
      (today.getMonth() + 1 === mm && today.getDate() >= dd);
    if (!hasBirthdayPassed) age--;
    return age;
  }

  /**
   * Devuelve el sexo a partir de la CURP.
   * Posición 10: H = Hombre, M = Mujer.
   */
  getGender(curp: string): string {
    const code = curp.substring(10, 11);
    return code === 'H' ? 'Hombre' : 'Mujer';
  }

  /**
   * Devuelve el nombre completo del estado a partir del código en la CURP.
   * Posiciones 11-12: clave de estado.
   */
  getState(curp: string): string {
    const code = curp.substring(11, 13);
    return MEXICAN_STATES[code] ?? 'Estado desconocido';
  }

  /**
   * Calcula el dígito verificador.
   * TODO: Implementar algoritmo oficial RENAPO.
   */
  calculateVerifier(curp: string): number {
    // TODO: Implement official checksum algorithm
    return 0;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private invalidResult(curp: string, message: string): CurpResult {
    return {
      valid: false,
      curp,
      birthDate: '',
      age: 0,
      gender: '',
      state: '',
      verifierValid: false,
      message,
    };
  }
}
