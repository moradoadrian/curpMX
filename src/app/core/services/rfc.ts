import { Injectable } from '@angular/core';
import { RfcResult } from '../../shared/interfaces/rfc-result.interface';

/**
 * Service for RFC (Registro Federal de Contribuyentes) validation and parsing.
 */
@Injectable({
  providedIn: 'root',
})
export class RfcService {

  private readonly valuesMap: { [key: string]: number } = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18, 'J': 19,
    'K': 20, 'L': 21, 'M': 22, 'N': 23, '&': 24, 'O': 25, 'P': 26, 'Q': 27, 'R': 28, 'S': 29,
    'T': 30, 'U': 31, 'V': 32, 'W': 33, 'X': 34, 'Y': 35, 'Z': 36, ' ': 37, 'Ñ': 38
  };

  /**
   * Validates a Mexican RFC and returns an RfcResult.
   */
  validate(rfc: string): RfcResult {
    const upper = rfc.trim().toUpperCase();

    // 1. Longitud
    if (upper.length !== 12 && upper.length !== 13) {
      return this.invalidResult(upper, 'Longitud incorrecta. El RFC debe tener 12 o 13 caracteres.');
    }

    // 2. RFC Genéricos
    if (upper === 'XAXX010101000' || upper === 'XEXX010101000') {
      return {
        valid: true,
        rfc: upper,
        type: 'Genérico',
        birthOrFoundationDate: '01/01/2001',
        homoclave: '000',
        message: 'RFC válido.',
      };
    }

    // 3. Formato mediante expresiones regulares
    const isPhysical = upper.length === 13;
    const physicalPattern = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
    const moralPattern = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;
    const pattern = isPhysical ? physicalPattern : moralPattern;

    if (!pattern.test(upper)) {
      return this.invalidResult(
        upper,
        isPhysical
          ? 'Formato inválido para Persona Física. Debe ser: 4 letras, 6 números y 3 caracteres de homoclave.'
          : 'Formato inválido para Persona Moral. Debe ser: 3 letras, 6 números y 3 caracteres de homoclave.'
      );
    }

    // 4. Validar fecha
    const startIdx = isPhysical ? 4 : 3;
    const datePart = upper.substring(startIdx, startIdx + 6);
    const yy = parseInt(datePart.substring(0, 2), 10);
    const mm = parseInt(datePart.substring(2, 4), 10);
    const dd = parseInt(datePart.substring(4, 6), 10);

    // El RFC no codifica el siglo: se asume 20XX salvo que la fecha quede en el futuro.
    const year = this.resolveYear(yy, mm, dd);

    const date = new Date(year, mm - 1, dd);
    if (date.getFullYear() !== year || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
      return this.invalidResult(upper, 'La fecha contenida en el RFC no es válida.');
    }
    const dateFormatted = `${dd.toString().padStart(2, '0')}/${mm.toString().padStart(2, '0')}/${year}`;

    // 5. Validar homoclave formato SAT
    const homoclave = upper.substring(upper.length - 3);
    // Tabla SAT de homonimia: "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ" (sin 0 ni O).
    // El primer carácter es el cociente (máx. 999 / 34 = 29 → 'V'); el segundo, el residuo.
    if (!/^[1-9A-NP-V][1-9A-NP-Z][0-9A]$/.test(homoclave)) {
      return this.invalidResult(upper, 'Homoclave inválida.');
    }

    // 6. Validar dígito verificador
    const expectedDigit = this.calculateCheckDigit(upper);
    if (expectedDigit !== homoclave.charAt(2)) {
      return this.invalidResult(upper, 'El dígito verificador del RFC es incorrecto.');
    }

    const type = isPhysical ? 'Física' : 'Moral';

    return {
      valid: true,
      rfc: upper,
      type,
      birthOrFoundationDate: dateFormatted,
      homoclave,
      message: 'RFC válido.',
    };
  }

  private resolveYear(yy: number, mm: number, dd: number): number {
    const candidate = new Date(2000 + yy, mm - 1, dd);
    return candidate.getTime() > Date.now() ? 1900 + yy : 2000 + yy;
  }

  /**
   * Calcula el dígito verificador (último carácter) de un RFC completo.
   * Solo se usan los primeros 11 (moral) o 12 (física) caracteres.
   */
  calculateCheckDigit(rfc: string): string {
    const normalizedRfc = rfc.length === 12 ? ` ${rfc}` : rfc;
    const base = normalizedRfc.slice(0, -1);
    
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      const char = base[i];
      const index = 13 - i;
      const value = this.valuesMap[char] ?? 0;
      sum += value * index;
    }
    
    const mod = (11000 - sum) % 11;
    if (mod === 11) return '0';
    if (mod === 10) return 'A';
    return String(mod);
  }

  private invalidResult(rfc: string, message: string): RfcResult {
    return {
      valid: false,
      rfc,
      type: '',
      birthOrFoundationDate: '',
      homoclave: '',
      message,
    };
  }
}
