import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessAnalysis } from './business-analysis';

describe('BusinessAnalysis', () => {
  let component: BusinessAnalysis;
  let fixture: ComponentFixture<BusinessAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessAnalysis],
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
