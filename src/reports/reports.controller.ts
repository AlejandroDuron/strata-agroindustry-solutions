import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GetReportsFilterDto } from './dto/get-reports-filter.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('yield-history')
  @ApiOperation({ 
    summary: 'Obtener histórico de rendimiento por lote y evaluar alerta del 20%',
    description: 'Retorna el historial comparativo (estimado vs real) de los ciclos cerrados de un lote (fieldId) y evalúa la regla de negocio: si el último rendimiento cayó más del 20% respecto al promedio histórico del lote.'
  })
  @ApiResponse({ status: 200, description: 'Histórico y análisis de alerta generados exitosamente.' })
  @ApiResponse({ status: 400, description: 'El parámetro fieldId es obligatorio.' })
  @ApiResponse({ status: 404, description: 'No se encontraron ciclos cerrados para el lote especificado.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getYieldHistory(@Query() filter: GetReportsFilterDto) {
    return this.reportsService.getYieldHistory(filter);
  }

  @Get('financial')
  @ApiOperation({ 
    summary: 'Obtener resumen financiero y rentabilidad de ciclos productivos',
    description: 'Calcula ingresos totales, costos de producción y margen bruto en base a la fotografía histórica inmutable de los ciclos cerrados (totalRevenueAtClose, totalCostAtClose, grossMarginAtClose). Permite filtrar opcionalmente por lote (fieldId) y rango de fechas de siembra (startDate, endDate).'
  })
  @ApiResponse({ status: 200, description: 'Resumen financiero calculado exitosamente.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getFinancialSummary(@Query() filter: GetReportsFilterDto) {
    return this.reportsService.getFinancialSummary(filter);
  }
}