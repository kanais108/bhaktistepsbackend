import { Test, TestingModule } from '@nestjs/testing';
import { TemplesService } from './temples.service';

describe('TemplesService', () => {
  let service: TemplesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplesService],
    }).compile();

    service = module.get<TemplesService>(TemplesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
