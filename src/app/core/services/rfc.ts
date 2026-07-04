import { Injectable } from '@angular/core';
import { RfcResult } from '../../shared/interfaces/rfc-result.interface';

/**
 * Service for RFC (Registro Federal de Contribuyentes) validation and parsing.
 */
@Injectable({
  providedIn: 'root',
})
export class RfcService {

  /**
   * Validates a Mexican RFC and returns an RfcResult.
   */
  validate(rfc: string): RfcResult {
    const upper = rfc.trim().toUpperCase();

    if (upper.length !== 12 && upper.length !== 13) {
      return this.invalidResult(upper, 'Longitud incorrecta. El RFC debe tener 12 o 13 caracteres.');
    }

    // Official general regex format:
    // Physical: 4 letters, 6 digits (YYMMDD), 3 alphanumeric homoclave/verifier
    // Moral: 3 letters, 6 digits (YYMMDD), 3 alphanumeric homoclave/verifier
    const physicalPattern = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
    const moralPattern = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;

    const isPhysical = upper.length === 13;
    const pattern = isPhysical ? physicalPattern : moralPattern;

    if (!pattern.test(upper)) {
      return this.invalidResult(
        upper,
        isPhysical
          ? 'Formato inválido para Persona Física. Debe ser: 4 letras, 6 números y 3 caracteres de homoclave.'
          : 'Formato inválido para Persona Moral. Debe ser: 3 letras, 6 números y 3 caracteres de homoclave.'
      );
    }

    const type = isPhysical ? 'Física' : 'Moral';
    const birthOrFoundationDate = this.getDate(upper, isPhysical);
    const homoclave = upper.substring(upper.length - 3);

    return {
      valid: true,
      rfc: upper,
      type,
      birthOrFoundationDate,
      homoclave,
      message: 'RFC válido.',
    };
  }

  private getDate(rfc: string, isPhysical: boolean): string {
    // Physical: start index 4, length 6
    // Moral: start index 3, length 6
    const startIdx = isPhysical ? 4 : 3;
    const datePart = rfc.substring(startIdx, startIdx + 6);

    const yy = datePart.substring(0, 2);
    const mm = datePart.substring(2, 4);
    const dd = datePart.substring(4, 6);

    const year = parseInt(yy, 10) <= 26 ? `20${yy}` : `19${yy}`;
    return `${dd}/${mm}/${year}`;
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
