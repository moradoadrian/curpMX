import { Injectable, inject } from '@angular/core';
import { CurpService } from './curp';
import { RfcService } from './rfc';

export type Gender = 'H' | 'M' | 'X';

export interface PersonData {
  /** Nombre(s) de pila. */
  names: string;
  /** Primer apellido (paterno). */
  firstSurname: string;
  /** Segundo apellido (materno). Opcional. */
  secondSurname?: string;
  /** Fecha de nacimiento. */
  birthDate: Date;
  gender: Gender;
  /** Clave de entidad de nacimiento (ej. "DF", "JC", "NE"). */
  stateCode: string;
}

export interface GeneratedDocuments {
  curp: string;
  rfc: string;
}

/** Partículas que se omiten en nombres y apellidos (RENAPO / SAT). */
const PARTICLES = new Set([
  'DA', 'DAS', 'DE', 'DEL', 'DER', 'DI', 'DIE', 'DD', 'EL', 'LA', 'LOS', 'LAS',
  'LE', 'LES', 'MAC', 'MC', 'VAN', 'VON', 'Y',
]);

/** Nombres que se omiten cuando la persona tiene un nombre compuesto. */
const COMMON_FIRST_NAMES = new Set(['MARIA', 'MA', 'JOSE', 'J']);

/** Anexo 2 del instructivo de la CURP: se sustituye la 2.ª letra por X. */
const CURP_INCONVENIENT = new Set([
  'BACA', 'BAKA', 'BUEI', 'BUEY', 'CACA', 'CACO', 'CAGA', 'CAGO', 'CAKA', 'CAKO',
  'COGE', 'COGI', 'COJA', 'COJE', 'COJI', 'COJO', 'COLA', 'CULO', 'FALO', 'FETO',
  'GETA', 'GUEI', 'GUEY', 'JETA', 'JOTO', 'KACA', 'KACO', 'KAGA', 'KAGO', 'KAKA',
  'KAKO', 'KOGE', 'KOGI', 'KOJA', 'KOJE', 'KOJI', 'KOJO', 'KOLA', 'KULO', 'LILO',
  'LOCA', 'LOCO', 'LOKA', 'LOKO', 'MAME', 'MAMO', 'MEAR', 'MEAS', 'MEON', 'MIAR',
  'MION', 'MOCO', 'MOKO', 'MULA', 'MULO', 'NACA', 'NACO', 'PEDA', 'PEDO', 'PENE',
  'PIPI', 'PITO', 'POPO', 'PUTA', 'PUTO', 'QULO', 'RATA', 'ROBA', 'ROBE', 'ROBO',
  'RUIN', 'SENO', 'TETA', 'VACA', 'VAGA', 'VAGO', 'VAKA', 'VUEI', 'VUEY', 'WUEI',
  'WUEY',
]);

/** Anexo IV del algoritmo del RFC (SAT): se sustituye la última letra por X. */
const RFC_INCONVENIENT = new Set([
  'BUEI', 'BUEY', 'CACA', 'CACO', 'CAGA', 'CAGO', 'CAKA', 'CAKO', 'COGE', 'COJA',
  'COJE', 'COJI', 'COJO', 'CULO', 'FETO', 'GUEY', 'JOTO', 'KACA', 'KACO', 'KAGA',
  'KAGO', 'KAKA', 'KOGE', 'KOJO', 'KULO', 'MAME', 'MAMO', 'MEAR', 'MEAS', 'MEON',
  'MION', 'MOCO', 'MULA', 'PEDA', 'PEDO', 'PENE', 'PUTA', 'PUTO', 'QULO', 'RATA',
  'RUIN',
]);

/** Valores para el cálculo de la homoclave del RFC (Anexo I del SAT). */
const HOMOCLAVE_VALUES: Record<string, string> = {
  ' ': '00', '0': '00', '1': '01', '2': '02', '3': '03', '4': '04', '5': '05',
  '6': '06', '7': '07', '8': '08', '9': '09', '&': '10', 'Ñ': '10',
  A: '11', B: '12', C: '13', D: '14', E: '15', F: '16', G: '17', H: '18', I: '19',
  J: '21', K: '22', L: '23', M: '24', N: '25', O: '26', P: '27', Q: '28', R: '29',
  S: '32', T: '33', U: '34', V: '35', W: '36', X: '37', Y: '38', Z: '39',
};

/** Anexo II del SAT: caracteres de la homoclave (sin 0 ni O). */
const HOMOCLAVE_CHARS = '123456789ABCDEFGHIJKLMNPQRSTUVWXYZ';

const VOWELS = 'AEIOU';

/**
 * GeneratorService — Calcula la CURP y el RFC (persona física) a partir de los
 * datos personales, siguiendo el instructivo de RENAPO y el algoritmo del SAT.
 *
 * Limitaciones inherentes:
 * - CURP: la posición 17 (diferenciador de homonimia) la asigna RENAPO. Aquí se
 *   usa el valor por defecto ("0" antes de 2000, "A" desde 2000), por lo que la
 *   CURP real puede diferir en los dos últimos caracteres.
 * - RFC: la homoclave calculada es la del algoritmo público; el SAT puede asignar
 *   otra en caso de homonimia.
 */
@Injectable({ providedIn: 'root' })
export class GeneratorService {
  private readonly curpService = inject(CurpService);
  private readonly rfcService = inject(RfcService);

  generate(data: PersonData): GeneratedDocuments {
    return { curp: this.generateCurp(data), rfc: this.generateRfc(data) };
  }

  // ── CURP ────────────────────────────────────────────────────────────────

  generateCurp(data: PersonData): string {
    const first = this.mainWord(this.normalize(data.firstSurname));
    const second = this.mainWord(this.normalize(data.secondSurname ?? ''));
    const name = this.selectName(this.normalize(data.names));

    let initials =
      this.charAt(first, 0) +
      this.firstInternal(first, (c) => VOWELS.includes(c)) +
      this.charAt(second, 0) +
      this.charAt(name, 0);
    initials = this.toCurpLetters(initials);
    if (CURP_INCONVENIENT.has(initials)) {
      initials = initials[0] + 'X' + initials.substring(2);
    }

    const consonants = this.toCurpLetters(
      this.firstInternal(first, this.isConsonant) +
        this.firstInternal(second, this.isConsonant) +
        this.firstInternal(name, this.isConsonant),
    );

    const year = data.birthDate.getFullYear();
    const differentiator = year < 2000 ? '0' : 'A';
    const curp17 =
      initials +
      this.formatDate(data.birthDate) +
      data.gender +
      data.stateCode +
      consonants +
      differentiator;

    return curp17 + this.curpService.calculateVerifier(curp17);
  }

  // ── RFC (persona física) ────────────────────────────────────────────────

  generateRfc(data: PersonData): string {
    const firstFull = this.normalize(data.firstSurname);
    const secondFull = this.normalize(data.secondSurname ?? '');
    const namesFull = this.normalize(data.names);

    const first = this.mainWord(firstFull);
    const second = this.mainWord(secondFull);
    const name = this.selectName(namesFull);

    let initials: string;
    if (!first || !second) {
      // Un solo apellido: dos primeras letras del apellido + dos del nombre.
      const surname = first || second;
      initials = surname.substring(0, 2) + name.substring(0, 2);
    } else if (first.length <= 2) {
      // Apellido paterno de una o dos letras.
      initials = first[0] + second[0] + name.substring(0, 2);
    } else {
      initials =
        first[0] + this.firstInternal(first, (c) => VOWELS.includes(c)) + second[0] + name[0];
    }
    initials = initials.padEnd(4, 'X');
    if (RFC_INCONVENIENT.has(initials)) {
      initials = initials.substring(0, 3) + 'X';
    }

    const fullName = [firstFull, secondFull, namesFull].filter(Boolean).join(' ');
    const base = initials + this.formatDate(data.birthDate) + this.homoclave(fullName);
    return base + this.rfcService.calculateCheckDigit(base + '0');
  }

  /** Homoclave de dos caracteres (Anexos I y II del SAT). */
  private homoclave(fullName: string): string {
    const digits =
      '0' +
      [...fullName].map((c) => HOMOCLAVE_VALUES[c] ?? '00').join('');

    let sum = 0;
    for (let i = 0; i < digits.length - 1; i++) {
      sum += parseInt(digits.substring(i, i + 2), 10) * parseInt(digits[i + 1], 10);
    }

    const last3 = sum % 1000;
    return HOMOCLAVE_CHARS[Math.floor(last3 / 34)] + HOMOCLAVE_CHARS[last3 % 34];
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Mayúsculas, sin acentos (conserva Ñ), sin caracteres especiales. */
  normalize(value: string): string {
    return value
      .toUpperCase()
      .replace(/Ñ/g, '\u0000')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\u0000/g, 'Ñ')
      .replace(/[^A-ZÑ& ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Primera palabra significativa (omite partículas como DE, DEL, LA…). */
  private mainWord(value: string): string {
    const words = value.split(' ').filter(Boolean);
    return words.find((w) => !PARTICLES.has(w)) ?? words[0] ?? '';
  }

  /** En nombres compuestos se omite MARÍA / JOSÉ si hay otro nombre después. */
  private selectName(value: string): string {
    const words = value.split(' ').filter((w) => w && !PARTICLES.has(w));
    if (words.length > 1 && COMMON_FIRST_NAMES.has(words[0])) {
      return words[1];
    }
    return words[0] ?? '';
  }

  private firstInternal(word: string, test: (c: string) => boolean): string {
    for (let i = 1; i < word.length; i++) {
      if (test(word[i])) return word[i];
    }
    return 'X';
  }

  private isConsonant = (c: string): boolean => /[A-ZÑ]/.test(c) && !VOWELS.includes(c);

  private charAt(word: string, index: number): string {
    return word[index] ?? 'X';
  }

  /** En la CURP la Ñ y los caracteres especiales se sustituyen por X. */
  private toCurpLetters(value: string): string {
    return value.replace(/[^A-Z]/g, 'X');
  }

  private formatDate(date: Date): string {
    const yy = (date.getFullYear() % 100).toString().padStart(2, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return yy + mm + dd;
  }
}
