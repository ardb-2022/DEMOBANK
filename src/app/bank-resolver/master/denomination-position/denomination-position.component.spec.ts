import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DenominationPositionComponent } from './denomination-position.component';

describe('DenominationPositionComponent', () => {
  let component: DenominationPositionComponent;
  let fixture: ComponentFixture<DenominationPositionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DenominationPositionComponent]
    });
    fixture = TestBed.createComponent(DenominationPositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
