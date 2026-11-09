import { Injectable } from '@angular/core';
import { CurpResult } from '../../shared/interfaces/curp-result.interface';
import { MEXICAN_STATES } from '../../shared/constants/mexican-states';

/** Sexo en la posición 11. RENAPO admite "X" (no binario) desde 2023. */
const GENDERS: Record<string, string> = {
  H: 'Hombre',
  M: 'Mujer',
  X: 'No binario',
};

/**
 * CurpService — Validación local de la CURP según el instructivo de RENAPO:
 * formato, fecha de nacimiento, sexo (H, M o X), entidad y dígito verificador.
 */
@Injectable({
  providedIn: 'root',
})
export class CurpService {

  /**
   * Valida una CURP completa y devuelve un CurpResult.
   */
  validate(curp: string): CurpResult {
    const upper = curp.trim().toUpperCase();

    if (upper.length !== 18) {
      return this.invalidResult(upper, 'Longitud incorrecta. La CURP debe tener exactamente 18 caracteres.');
    }

    // Expresión regular oficial
    const pattern = /^[A-ZÑ][AEIOUX][A-ZÑ]{2}\d{6}[HMX][A-Z]{2}[B-DF-HJ-NP-TV-ZÑ]{3}[A-Z0-9]\d$/;
    if (!pattern.test(upper)) {
      return this.invalidResult(upper, 'Formato inválido. Verifica que la CURP contenga los caracteres correctos.');
    }

    const stateCode = upper.substring(11, 13);
    if (!MEXICAN_STATES[stateCode]) {
      return this.invalidResult(upper, `Estado "${stateCode}" no reconocido.`);
    }

    const genderCode = upper.substring(10, 11);
    const gender = GENDERS[genderCode];
    if (!gender) {
      return this.invalidResult(upper, 'Sexo inválido.');
    }

    // Validación de fecha real
    const dateStr = upper.substring(4, 10);
    const yy = parseInt(dateStr.substring(0, 2), 10);
    const mm = parseInt(dateStr.substring(2, 4), 10);
    const dd = parseInt(dateStr.substring(4, 6), 10);

    /*
     * Lógica oficial de asignación del siglo por RENAPO (Posición 17 del formato CURP):
     * El carácter en la posición 17 funciona como diferenciador de homonimia y del siglo de nacimiento.
     * 
     * Regla oficial de RENAPO:
     * - Si la fecha de nacimiento es anterior al año 2000 (1900 - 1999), RENAPO asigna un dígito numérico (del '0' al '9').
     * - Si la fecha de nacimiento es del año 2000 en adelante, RENAPO asigna una letra mayúscula (de la 'A' a la 'Z').
     * 
     * Es por esto que verificamos explícitamente si el carácter es numérico para determinar determinísticamente 
     * el siglo de nacimiento, sin adivinar basado únicamente en el valor del año.
     */
    const centuryChar = upper.charAt(16);
    const is1900 = centuryChar >= '0' && centuryChar <= '9';
    const year = is1900 ? 1900 + yy : 2000 + yy;

    const date = new Date(year, mm - 1, dd);
    if (date.getFullYear() !== year || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
      return this.invalidResult(upper, 'La fecha de nacimiento contenida en la CURP no es válida.');
    }
    if (date.getTime() > Date.now()) {
      return this.invalidResult(upper, 'La fecha de nacimiento contenida en la CURP está en el futuro.');
    }

    // Algoritmo oficial de dígito verificador RENAPO
    const expectedVerifier = this.calculateVerifier(upper.substring(0, 17));
    if (expectedVerifier.toString() !== upper.charAt(17)) {
      return this.invalidResult(upper, 'El dígito verificador de la CURP es incorrecto.');
    }

    return {
      valid: true,
      curp: upper,
      birthDate: `${dd.toString().padStart(2, '0')}/${mm.toString().padStart(2, '0')}/${year}`,
      age: this.getAge(year, mm, dd),
      gender,
      state: MEXICAN_STATES[stateCode],
      verifierValid: true,
      message: 'CURP válida.',
    };
  }

  /**
   * Calcula la edad a partir de la fecha de nacimiento.
   */
  private getAge(year: number, month: number, day: number): number {
    const today = new Date();
    let age = today.getFullYear() - year;
    const hasBirthdayPassed =
      today.getMonth() + 1 > month ||
      (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!hasBirthdayPassed) age--;
    return Math.max(0, age);
  }

  /**
   * Calcula el dígito verificador utilizando el algoritmo módulo 10 de RENAPO.
   */
  calculateVerifier(curp17: string): number {
    const dictionary = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    let sum = 0;

    for (let i = 0; i < 17; i++) {
      const char = curp17.charAt(i);
      const value = dictionary.indexOf(char);
      sum += value * (18 - i);
    }

    const mod = 10 - (sum % 10);
    return mod === 10 ? 0 : mod;
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
