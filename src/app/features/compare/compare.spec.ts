import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Compare } from './compare';
import { GeneratorService } from '../../core/services/generator';

describe('Compare', () => {
  let component: Compare;
  let fixture: ComponentFixture<Compare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [Compare],
    }).compileComponents();

    fixture = TestBed.createComponent(Compare);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep the button disabled until both lengths are valid', () => {
    component.form.setValue({ curp: 'ABC', rfc: '' });
    expect(component.canCompare).toBe(false);
  });

  it('should strip invalid characters and uppercase the input', () => {
    component.form.controls.curp.setValue('pelj-9001 15');
    component.onInput('curp');
    expect(component.form.controls.curp.value).toBe('PELJ900115');
  });

  it('should compare a matching pair and render the result', () => {
    const docs = TestBed.inject(GeneratorService).generate({
      names: 'Gloria',
      firstSurname: 'Hernández',
      secondSurname: 'García',
      birthDate: new Date(1956, 3, 27),
      gender: 'M',
      stateCode: 'VZ',
    });
    component.form.setValue({ curp: docs.curp, rfc: docs.rfc });
    component.compare();
    expect(component.result()?.status).toBe('match');

    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Coinciden');
    expect(text).toContain('Veracruz');
  });
});
