import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentMasterComponent } from './agent-master.component';

describe('AgentMasterComponent', () => {
  let component: AgentMasterComponent;
  let fixture: ComponentFixture<AgentMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgentMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgentMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
