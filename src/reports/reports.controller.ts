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
    summary: 'Obtener histórico de rendimiento por lote y evaluar alerta del 20%',
    description: 'Retorna el historial comparativo (estimado vs real) de los ciclos cerrados de un lote (fieldId) y evalúa la regla de negocio: si el último rendimiento cayó más del 20% respecto al promedio histórico del lote.'
  })
  @ApiQuery({ name: 'fieldId', type: Number, required: true, description: 'ID del lote a consultar' })
  @ApiResponse({ status: 200, description: 'Histórico y análisis de alerta generados exitosamente.' })
  @ApiResponse({ status: 400, description: 'El parámetro fieldId es obligatorio.' })
  @ApiResponse({ status: 404, description: 'No se encontraron ciclos cerrados para el lote especificado.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getYieldHistory(@Query() filter: GetReportsFilterDto) {
    return this.reportsService.getYieldHistory(filter);
  }

  @Get('financial')
  @Roles('admin', 'gerente', 'auditor')
  @ApiOperation({
    summary: 'Obtener resumen financiero y rentabilidad de ciclos productivos',
    description: 'Calcula ingresos totales, costos de producción y margen bruto en base a la fotografía histórica inmutable de los ciclos cerrados (totalRevenueAtClose, totalCostAtClose, grossMarginAtClose). Permite filtrar opcionalmente por lote (fieldId) y rango de fechas de siembra (startDate, endDate).'
  })
  @ApiQuery({ name: 'fieldId', type: Number, required: false, description: 'ID del lote para filtrar' })
  @ApiQuery({ name: 'startDate', type: String, required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: String, required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Resumen financiero calculado exitosamente.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getFinancialSummary(@Query() filter: GetReportsFilterDto) {
    return this.reportsService.getFinancialSummary(filter);
  }
}