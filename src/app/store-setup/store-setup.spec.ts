import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreSetup } from './store-setup';

describe('StoreSetup', () => {
  let component: StoreSetup;
  let fixture: ComponentFixture<StoreSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreSetup],
    }).compileComponents();

    fixture = TestBed.createComponent(StoreSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
