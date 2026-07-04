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

  it('should validate a correct physical person RFC', () => {
    const result = service.validate('VECJ880326XXX');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('Física');
    expect(result.birthOrFoundationDate).toBe('26/03/1988');
    expect(result.homoclave).toBe('XXX');
  });

  it('should validate a correct moral person RFC', () => {
    const result = service.validate('ABC680524YYY');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('Moral');
    expect(result.birthOrFoundationDate).toBe('24/05/1968');
    expect(result.homoclave).toBe('YYY');
  });

  it('should invalidate an incorrect RFC length', () => {
    const result = service.validate('ABCD880326');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Longitud incorrecta');
  });

  it('should invalidate RFC with wrong pattern', () => {
    const result = service.validate('VECJ880326XX!');
    expect(result.valid).toBe(false);
  });
});
