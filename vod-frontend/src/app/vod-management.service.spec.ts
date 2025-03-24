import { TestBed } from '@angular/core/testing';

import { VodManagementService } from './vod-management.service';

describe('VodManagementService', () => {
  let service: VodManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VodManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
