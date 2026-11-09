import { TestBed } from '@angular/core/testing';

import { GeneratorService, PersonData } from './generator';
import { CurpService } from './curp';
import { RfcService } from './rfc';

describe('GeneratorService', () => {
  let service: GeneratorService;
  let curpService: CurpService;
  let rfcService: RfcService;

  const person = (overrides: Partial<PersonData>): PersonData => ({
    names: 'JUAN',
    firstSurname: 'PEREZ',
    secondSurname: 'LOPEZ',
    birthDate: new Date(1990, 0, 15),
    gender: 'H',
    stateCode: 'DF',
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeneratorService);
    curpService = TestBed.inject(CurpService);
    rfcService = TestBed.inject(RfcService);
  });

  describe('CURP', () => {
    it('should generate a reference CURP', () => {
      const curp = service.generateCurp(
        person({
          names: 'Gloria',
          firstSurname: 'Hernández',
          secondSurname: 'García',
          birthDate: new Date(1956, 3, 27),
          gender: 'M',
          stateCode: 'VZ',
        }),
      );
      expect(curp).toBe('HEGG560427MVZRRL04');
    });

    it('should use the second name when the first is MARÍA or JOSÉ', () => {
      const curp = service.generateCurp(person({ names: 'María Luisa' }));
      expect(curp.substring(0, 4)).toBe('PELL');
      expect(curp.substring(13, 16)).toBe('RPS');
    });

    it('should skip particles in compound surnames', () => {
      const curp = service.generateCurp(person({ firstSurname: 'de la Rosa' }));
      expect(curp.substring(0, 2)).toBe('RO');
    });

    it('should replace Ñ with X', () => {
      const curp = service.generateCurp(person({ firstSurname: 'Muñoz', names: 'Ñaki' }));
      expect(curp.substring(0, 4)).toBe('MULX');
      expect(curp.charAt(13)).toBe('X');
    });

    it('should use X when there is no second surname', () => {
      const curp = service.generateCurp(person({ secondSurname: '' }));
      expect(curp.charAt(2)).toBe('X');
      expect(curp.charAt(14)).toBe('X');
    });

    it('should replace inconvenient words', () => {
      const curp = service.generateCurp(
        person({ firstSurname: 'Bueno', secondSurname: 'Espinosa', names: 'Yolanda' }),
      );
      expect(curp.substring(0, 4)).toBe('BXEY');
    });

    it('should use "A" as differentiator for births from 2000', () => {
      const curp = service.generateCurp(person({ birthDate: new Date(2005, 5, 1) }));
      expect(curp.charAt(16)).toBe('A');
      expect(curpService.validate(curp).birthDate).toBe('01/06/2005');
    });

    it('should produce CURPs that pass validation', () => {
      for (const gender of ['H', 'M', 'X'] as const) {
        const result = curpService.validate(service.generateCurp(person({ gender })));
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('RFC', () => {
    it('should generate a reference RFC with homoclave', () => {
      const rfc = service.generateRfc(
        person({
          names: 'Juan',
          firstSurname: 'Barrios',
          secondSurname: 'Fernández',
          birthDate: new Date(1970, 11, 13),
        }),
      );
      expect(rfc).toBe('BAFJ701213SBA');
    });

    it('should use two letters of surname and name when there is a single surname', () => {
      const rfc = service.generateRfc(person({ secondSurname: '' }));
      expect(rfc.substring(0, 4)).toBe('PEJU');
    });

    it('should handle first surnames with two letters or fewer', () => {
      const rfc = service.generateRfc(person({ firstSurname: 'Ek' }));
      expect(rfc.substring(0, 4)).toBe('ELJU');
    });

    it('should replace the last letter of inconvenient words', () => {
      const rfc = service.generateRfc(
        person({ firstSurname: 'Bueno', secondSurname: 'Espinosa', names: 'Yolanda' }),
      );
      expect(rfc.substring(0, 4)).toBe('BUEX');
    });

    it('should produce RFCs that pass validation', () => {
      const result = rfcService.validate(service.generateRfc(person({})));
      expect(result.valid).toBe(true);
      expect(result.birthOrFoundationDate).toBe('15/01/1990');
    });
  });
});
