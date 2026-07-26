import type { Report } from '../../domain/interfaces/IReportRepository'
import type {
  CreateReportDto,
  IReportRepository,
} from '../../domain/interfaces/IReportRepository'

export class CreateReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  execute(input: CreateReportDto): Promise<Report> {
    return this.reportRepository.create(input)
  }
}
