import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GetReportsFilterDto } from './dto/get-reports-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
@ApiForbiddenResponse({ description: 'The user role does not have permission for this operation' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('yield-history')
  @Roles('admin', 'gerente', 'auditor')
  @ApiOperation({
    summary: 'Get yield history by field and evaluate the 20% alert',
    description: 'Returns the comparative history (estimated vs actual) of closed cycles for a field (fieldId) and evaluates the business rule: whether the latest yield dropped more than 20% below the historical field average.'
  })
  @ApiQuery({ name: 'fieldId', type: Number, required: true, description: 'Field ID to query' })
  @ApiResponse({ status: 200, description: 'Yield history and alert analysis generated successfully.' })
  @ApiResponse({ status: 400, description: 'The fieldId parameter is required.' })
  @ApiResponse({ status: 404, description: 'No closed cycles found for the specified field.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getYieldHistory(@Query() filter: GetReportsFilterDto) {
    return this.reportsService.getYieldHistory(filter);
  }

  @Get('financial')
  @Roles('admin', 'gerente', 'auditor')
  @ApiOperation({
    summary: 'Get financial summary and profitability of production cycles',
    description: 'Calculates total revenue, production costs, and gross margin based on the immutable historical snapshot of closed cycles (totalRevenueAtClose, totalCostAtClose, grossMarginAtClose). Optionally filter by field (fieldId) and sowing date range (startDate, endDate).'
  })
  @ApiQuery({ name: 'fieldId', type: Number, required: false, description: 'Field ID to filter by' })
  @ApiQuery({ name: 'startDate', type: String, required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: String, required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Financial summary calculated successfully.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getFinancialSummary(@Query() filter: GetReportsFilterDto) {
    return this.reportsService.getFinancialSummary(filter);
  }
}