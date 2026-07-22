import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ProductionCycleService } from './production-cycle.service';
import { CreateProductionCycleDto } from './dto/create-production-cycle.dto';
import { UpdateProductionCycleDto } from './dto/update-production-cycle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Production Cycles')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
@ApiForbiddenResponse({ description: 'The user role does not have permission for this operation' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production-cycle')
export class ProductionCycleController {
  constructor(
    private readonly productionCycleService: ProductionCycleService,
  ) {}

  @Post()
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Open a new production cycle' })
  @ApiResponse({ status: 201, description: 'Cycle created successfully' })
  @ApiResponse({ status: 400, description: 'The field already has an open cycle' })
  @ApiResponse({ status: 404, description: 'Field or crop not found' })
  create(@Body() createDto: CreateProductionCycleDto) {
    return this.productionCycleService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all production cycles' })
  findAll() {
    return this.productionCycleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a production cycle by ID' })
  @ApiResponse({ status: 404, description: 'Cycle not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productionCycleService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Update a production cycle' })
  @ApiResponse({ status: 400, description: 'Cannot modify a closed cycle' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductionCycleDto,
  ) {
    return this.productionCycleService.update(id, updateDto);
  }

  @Patch(':id/close')
  @Roles('admin', 'gerente')
  @ApiOperation({
    summary: 'Close a production cycle',
    description:
      'Validates at least one harvest exists, calculates real yield vs estimated, gross margin, and updates status to CLOSED.',
  })
  @ApiResponse({ status: 200, description: 'Cycle closed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cycle cannot be closed (no harvests or already closed)',
  })
  close(@Param('id', ParseIntPipe) id: number) {
    return this.productionCycleService.close(id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a production cycle (soft delete by default, hard delete with ?hard=true)' })
  remove(@Param('id', ParseIntPipe) id: number, @Query('hard') hard?: string) {
    return this.productionCycleService.remove(id, hard === 'true');
  }
}
