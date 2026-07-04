import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Curp } from './curp';

describe('Curp', () => {
  let component: Curp;
  let fixture: ComponentFixture<Curp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Curp],
    }).compileComponents();

    fixture = TestBed.createComponent(Curp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
