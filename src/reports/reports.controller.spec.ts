import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportPreset } from './dto/report-filter.dto';

describe('ReportsController', () => {
  let controller: ReportsController;

  const reportsServiceMock = {
    getReportData: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: reportsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate to getReportData with the query filter', () => {
    const filter = { storeId: 's1', preset: ReportPreset.TODAY };
    controller.getReportData(filter);
    expect(reportsServiceMock.getReportData).toHaveBeenCalledWith(filter);
  });
});
