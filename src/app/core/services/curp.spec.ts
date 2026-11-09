import { TestBed } from '@angular/core/testing';

import { CurpService } from './curp';

describe('CurpService', () => {
  let service: CurpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('CURP válidas', () => {
    it('should validate a correct CURP from the 1900s', () => {
      // 1978, Mes 04, Día 16, Hombre, DF. Dígito verificador matemático es 3.
      const result = service.validate('GOYA780416HDFNMR03');
      expect(result.valid).toBe(true);
      expect(result.gender).toBe('Hombre');
      expect(result.birthDate).toBe('16/04/1978');
      expect(result.verifierValid).toBe(true);
    });

    it('should validate a correct CURP from the 2000s', () => {
      // 2008, Mes 04, Día 16. La letra A indica el siglo 2000. Dígito verificador matemático es 1.
      const result = service.validate('GOYA080416HDFNMRA1');
      expect(result.valid).toBe(true);
      expect(result.gender).toBe('Hombre');
      expect(result.birthDate).toBe('16/04/2008');
      expect(result.verifierValid).toBe(true);
    });
  });

  describe('Correcciones', () => {
    it('should accept gender X (no binario)', () => {
      const base = 'GOYA780416XDFNMR0';
      const verifier = service.calculateVerifier(base);
      const result = service.validate(base + verifier);
      expect(result.valid).toBe(true);
      expect(result.gender).toBe('No binario');
    });

    it('should reject birth dates in the future', () => {
      const base = 'GOYA991231HDFNMRA'; // "A" → año 2099
      const result = service.validate(base + service.calculateVerifier(base));
      expect(result.valid).toBe(false);
      expect(result.message).toContain('futuro');
    });
  });

  describe('CURP inválidas', () => {
    it('should invalidate an incorrect CURP length', () => {
      const result = service.validate('GOYA780416HDFNMR0');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Longitud incorrecta');
    });

    it('should invalidate CURP with non-existent date', () => {
      const result = service.validate('GOYA781316HDFNMR05'); // Mes 13
      expect(result.valid).toBe(false);
      expect(result.message).toBe('La fecha de nacimiento contenida en la CURP no es válida.');

      const result2 = service.validate('GOYA780230HDFNMR08'); // Febrero 30
      expect(result2.valid).toBe(false);
      expect(result2.message).toBe('La fecha de nacimiento contenida en la CURP no es válida.');
    });

    it('should invalidate CURP with unrecognized state', () => {
      // XX is not a valid Mexican state code
      const result = service.validate('GOYA780416HXXNMR02');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('no reconocido');
    });

    it('should invalidate CURP with wrong verification digit', () => {
      // GOYA780416HDFNMR0 debe terminar en 3. Terminamos en 5 para forzar error.
      const result = service.validate('GOYA780416HDFNMR05');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('El dígito verificador de la CURP es incorrecto.');
    });

    it('should invalidate CURP with wrong format characters', () => {
      const result = service.validate('GOYA780416HDFNM!03');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Formato inválido');
    });
  });
});
