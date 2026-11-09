import { TestBed } from '@angular/core/testing';
import { RfcService } from './rfc';

describe('RfcService', () => {
  let service: RfcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RfcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('RFC válidos', () => {
    it('should validate a correct physical person RFC (MORC980826AB5)', () => {
      // Usando MORC980826AB5 porque el dígito verificador real matemático es 5 para esa base.
      const result = service.validate('MORC980826AB5');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('Física');
      expect(result.birthOrFoundationDate).toBe('26/08/1998');
      expect(result.homoclave).toBe('AB5');
    });

    it('should validate generic RFC XAXX010101000', () => {
      const result = service.validate('XAXX010101000');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('Genérico');
    });

    it('should validate generic RFC XEXX010101000', () => {
      const result = service.validate('XEXX010101000');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('Genérico');
    });
  });

  describe('Correcciones', () => {
    const withDigit = (base12: string) => base12 + service.calculateCheckDigit(base12 + '0');

    it('should assume the 1900s when the 2000s date would be in the future', () => {
      const nextYear = (new Date().getFullYear() + 1) % 100;
      const yy = nextYear.toString().padStart(2, '0');
      const result = service.validate(withDigit(`MORC${yy}0101AB`));
      expect(result.valid).toBe(true);
      expect(result.birthOrFoundationDate).toBe(`01/01/19${yy}`);
    });

    it('should assume the 2000s for past dates', () => {
      const result = service.validate(withDigit('MORC050101AB'));
      expect(result.birthOrFoundationDate).toBe('01/01/2005');
    });

    it('should reject the letter O in the homoclave', () => {
      const result = service.validate(withDigit('MORC980826OB'));
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Homoclave inválida.');
    });

    it('should reject a first homoclave character beyond V', () => {
      const result = service.validate(withDigit('MORC980826WB'));
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Homoclave inválida.');
    });
  });

  describe('RFC inválidos', () => {
    it('should invalidate an incorrect RFC length', () => {
      const result = service.validate('ABCD880326');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Longitud incorrecta');
    });

    it('should invalidate RFC with non-existent date', () => {
      const result = service.validate('MORC981326AB1'); // Mes 13
      expect(result.valid).toBe(false);
      expect(result.message).toBe('La fecha contenida en el RFC no es válida.');

      const result2 = service.validate('MORC980230AB1'); // Febrero 30
      expect(result2.valid).toBe(false);
      expect(result2.message).toBe('La fecha contenida en el RFC no es válida.');
      
      const result3 = service.validate('MORC000000AB1'); // 00/00/00
      expect(result3.valid).toBe(false);
      expect(result3.message).toBe('La fecha contenida en el RFC no es válida.');
    });

    it('should invalidate RFC with wrong verification digit', () => {
      const result = service.validate('MORC980826AB1'); // El dígito correcto según el algoritmo SAT es 5
      expect(result.valid).toBe(false);
      expect(result.message).toBe('El dígito verificador del RFC es incorrecto.');
    });

    it('should invalidate RFC with incorrect homoclave', () => {
      // El formato SAT debe ser [A-V1-9][A-Z1-9][0-9A]
      const result = service.validate('MORC980826Z85'); // Z no es válido al inicio de la homoclave
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Homoclave inválida.');
    });

    it('should invalidate RFC with invalid characters', () => {
      const result = service.validate('MORC980826AB!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Formato inválido');
    });
  });
});
