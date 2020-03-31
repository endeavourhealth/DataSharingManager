import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CohortComponent } from './cohort.component';

describe('CohortComponent', () => {
  let component: CohortComponent;
  let fixture: ComponentFixture<CohortComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CohortComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CohortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
