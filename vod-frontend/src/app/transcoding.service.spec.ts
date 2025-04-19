import { TestBed } from '@angular/core/testing';

import { TranscodingService } from './transcoding.service';

describe('TranscodingService', () => {
  let service: TranscodingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranscodingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
