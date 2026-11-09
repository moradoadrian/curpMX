import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Generator } from './generator';

describe('Generator', () => {
  let component: Generator;
  let fixture: ComponentFixture<Generator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [Generator],
    }).compileComponents();

    fixture = TestBed.createComponent(Generator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not generate while the form is invalid', () => {
    component.generate();
    expect(component.result()).toBeNull();
    expect(component.form.controls.names.touched).toBe(true);
  });

  it('should reject future birth dates', () => {
    component.form.controls.birthDate.setValue('2999-01-01');
    expect(component.form.controls.birthDate.hasError('futureDate')).toBe(true);
  });

  it('should generate CURP and RFC from valid data', () => {
    component.form.setValue({
      names: 'Gloria',
      firstSurname: 'Hernández',
      secondSurname: 'García',
      birthDate: '1956-04-27',
      gender: 'M',
      stateCode: 'VZ',
    });
    component.generate();
    expect(component.result()?.curp).toBe('HEGG560427MVZRRL04');
    expect(component.result()?.rfc.substring(0, 10)).toBe('HEGG560427');
  });

  it('should clear the result when the form changes', () => {
    component.form.setValue({
      names: 'Juan',
      firstSurname: 'Pérez',
      secondSurname: '',
      birthDate: '1990-01-15',
      gender: 'H',
      stateCode: 'DF',
    });
    component.generate();
    expect(component.result()).not.toBeNull();
    component.form.controls.names.setValue('Pedro');
    expect(component.result()).toBeNull();
  });
});
