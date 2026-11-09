import { Injectable, inject } from '@angular/core';
import { CurpService } from './curp';
import { RfcService } from './rfc';
import { CurpResult } from '../../shared/interfaces/curp-result.interface';
import { RfcResult } from '../../shared/interfaces/rfc-result.interface';

export type CompareStatus = 'match' | 'probable' | 'mismatch' | 'invalid';

export interface CompareResult {
  status: CompareStatus;
  /** Explicación para el usuario. */
  message: string;
  curp: CurpResult;
  rfc: RfcResult;
  /** Por cada una de las 10 primeras posiciones: ¿coinciden? */
  positions: boolean[];
}

/**
 * CompareService — Verifica si una CURP y un RFC pertenecen a la misma persona.
 *
 * Ambos comparten las 4 letras iniciales y la fecha (AAMMDD), pero RENAPO y el
 * SAT aplican reglas distintas en algunos casos, así que una diferencia en las
 * letras no siempre significa que sean de personas distintas.
 */
@Injectable({ providedIn: 'root' })
export class CompareService {
  private readonly curpService = inject(CurpService);
  private readonly rfcService = inject(RfcService);

  compare(curpValue: string, rfcValue: string): CompareResult {
    const curp = this.curpService.validate(curpValue);
    const rfc = this.rfcService.validate(rfcValue);
    const c = curp.curp.substring(0, 10);
    const r = rfc.rfc.substring(0, 10);
    const positions = [...Array(10)].map((_, i) => !!c[i] && c[i] === r[i]);
    const result = (status: CompareStatus, message: string): CompareResult => ({
      status,
      message,
      curp,
      rfc,
      positions,
    });

    if (!curp.valid) return result('invalid', `La CURP no es válida: ${curp.message}`);
    if (!rfc.valid) return result('invalid', `El RFC no es válido: ${rfc.message}`);
    if (rfc.type === 'Genérico') {
      return result('invalid', 'El RFC genérico no corresponde a una persona y no se puede comparar.');
    }
    if (rfc.type === 'Moral') {
      return result('mismatch', 'El RFC es de una persona moral (empresa); la CURP es de una persona física.');
    }

    if (c.substring(4) !== r.substring(4)) {
      return result(
        'mismatch',
        `Las fechas de nacimiento no coinciden (CURP: ${curp.birthDate}, RFC: ${rfc.birthOrFoundationDate}).`,
      );
    }

    if (c === r) {
      return result('match', 'La CURP y el RFC coinciden: corresponden a la misma persona.');
    }

    const explanation = this.explainLetterDifference(c.substring(0, 4), r.substring(0, 4));
    if (explanation) {
      return result('probable', `La fecha coincide y la diferencia en las letras es esperable: ${explanation}`);
    }

    return result('mismatch', 'La fecha coincide, pero las letras iniciales corresponden a nombres distintos.');
  }

  /**
   * Devuelve la explicación si la diferencia entre las 4 letras de la CURP y
   * del RFC se debe a una regla conocida; `null` si no hay explicación.
   */
  private explainLetterDifference(c: string, r: string): string | null {
    // Diferencias solo donde alguno tiene X (palabra inconveniente, Ñ, carácter especial).
    const onlyXorÑ = [...c].every(
      (ch, i) => ch === r[i] || ch === 'X' || r[i] === 'X' || r[i] === 'Ñ',
    );
    if (onlyXorÑ) {
      return 'RENAPO y el SAT sustituyen por "X" letras distintas (palabras inconvenientes, Ñ o caracteres especiales).';
    }

    // Un solo apellido: CURP = A V X N   ·   RFC = A A N N
    if (c[2] === 'X' && c[0] === r[0] && c[3] === r[2]) {
      return 'con un solo apellido, la CURP usa "X" y el RFC toma dos letras del apellido y dos del nombre.';
    }

    // Primer apellido de una o dos letras: CURP = P V M N   ·   RFC = P M N N
    if (c[0] === r[0] && c[2] === r[1] && c[3] === r[2]) {
      return 'con un primer apellido de una o dos letras, el RFC usa la inicial del segundo apellido y dos letras del nombre.';
    }

    return null;
  }
}
