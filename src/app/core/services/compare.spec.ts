import { TestBed } from '@angular/core/testing';

import { CompareService } from './compare';
import { GeneratorService, PersonData } from './generator';
import { RfcService } from './rfc';

describe('CompareService', () => {
  let service: CompareService;
  let generator: GeneratorService;
  let rfcService: RfcService;

  const person = (overrides: Partial<PersonData> = {}): PersonData => ({
    names: 'Juan',
    firstSurname: 'Pérez',
    secondSurname: 'López',
    birthDate: new Date(1990, 0, 15),
    gender: 'H',
    stateCode: 'DF',
    ...overrides,
  });

  const compareGenerated = (data: PersonData) => {
    const docs = generator.generate(data);
    return service.compare(docs.curp, docs.rfc);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompareService);
    generator = TestBed.inject(GeneratorService);
    rfcService = TestBed.inject(RfcService);
  });

  it('should match CURP and RFC of the same person', () => {
    const result = compareGenerated(person());
    expect(result.status).toBe('match');
    expect(result.positions.every(Boolean)).toBe(true);
  });

  describe('coincidencia probable', () => {
    it('should explain inconvenient words (BXEY vs BUEX)', () => {
      const result = compareGenerated(
        person({ firstSurname: 'Bueno', secondSurname: 'Espinosa', names: 'Yolanda' }),
      );
      expect(result.status).toBe('probable');
      expect(result.message).toContain('"X"');
    });

    it('should explain Ñ (MULX vs MULÑ)', () => {
      const result = compareGenerated(person({ firstSurname: 'Muñoz', names: 'Ñaki' }));
      expect(result.status).toBe('probable');
    });

    it('should explain a single surname (PEXJ vs PEJU)', () => {
      const result = compareGenerated(person({ secondSurname: '' }));
      expect(result.status).toBe('probable');
      expect(result.message).toContain('un solo apellido');
    });

    it('should explain a short first surname (EXLJ vs ELJU)', () => {
      const result = compareGenerated(person({ firstSurname: 'Ek' }));
      expect(result.status).toBe('probable');
      expect(result.message).toContain('una o dos letras');
    });
  });

  describe('no coinciden', () => {
    it('should detect different birth dates', () => {
      const curp = generator.generateCurp(person());
      const rfc = generator.generateRfc(person({ birthDate: new Date(1990, 0, 16) }));
      const result = service.compare(curp, rfc);
      expect(result.status).toBe('mismatch');
      expect(result.message).toContain('fechas');
      expect(result.positions.slice(0, 9).every(Boolean)).toBe(true);
      expect(result.positions[9]).toBe(false);
    });

    it('should detect different names', () => {
      const curp = generator.generateCurp(person());
      const rfc = generator.generateRfc(person({ names: 'Roberto', firstSurname: 'Gómez' }));
      expect(service.compare(curp, rfc).status).toBe('mismatch');
    });

    it('should reject a company RFC', () => {
      const curp = generator.generateCurp(person());
      const moral = 'ABC900115AB';
      const rfc = moral + rfcService.calculateCheckDigit(moral + '0');
      const result = service.compare(curp, rfc);
      expect(result.rfc.valid).toBe(true);
      expect(result.status).toBe('mismatch');
      expect(result.message).toContain('persona moral');
    });
  });

  describe('datos inválidos', () => {
    it('should report an invalid CURP', () => {
      const result = service.compare('XXXX', generator.generateRfc(person()));
      expect(result.status).toBe('invalid');
      expect(result.message).toContain('La CURP no es válida');
    });

    it('should report an invalid RFC', () => {
      const result = service.compare(generator.generateCurp(person()), 'PELJ900115XX1');
      expect(result.status).toBe('invalid');
      expect(result.message).toContain('El RFC no es válido');
    });

    it('should not compare a generic RFC', () => {
      const result = service.compare(generator.generateCurp(person()), 'XAXX010101000');
      expect(result.status).toBe('invalid');
      expect(result.message).toContain('genérico');
    });
  });
});
