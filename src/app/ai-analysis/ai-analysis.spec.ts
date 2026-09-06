import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiAnalysis } from './ai-analysis';

describe('AiAnalysis', () => {
  let component: AiAnalysis;
  let fixture: ComponentFixture<AiAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiAnalysis],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
