import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Rfc } from './rfc';

describe('Rfc', () => {
  let component: Rfc;
  let fixture: ComponentFixture<Rfc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [Rfc],
    }).compileComponents();

    fixture = TestBed.createComponent(Rfc);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
