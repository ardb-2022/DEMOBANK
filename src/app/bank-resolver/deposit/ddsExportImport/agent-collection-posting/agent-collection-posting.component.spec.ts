import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentCollectionPostingComponent } from './agent-collection-posting.component';

describe('AgentCollectionPostingComponent', () => {
  let component: AgentCollectionPostingComponent;
  let fixture: ComponentFixture<AgentCollectionPostingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgentCollectionPostingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgentCollectionPostingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
