import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { HarvestsService } from './harvests.service';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { UpdateHarvestDto } from './dto/update-harvest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Harvests')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
@ApiForbiddenResponse({ description: 'The user role does not have permission for this operation' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('harvests')
export class HarvestsController {
  constructor(private readonly harvestsService: HarvestsService) {}

  @Post()
  @Roles('admin', 'gerente', 'operador')
  @ApiOperation({ summary: 'Register a new harvest' })
  @ApiResponse({ status: 201, description: 'Harvest created successfully' })
  @ApiResponse({ status: 400, description: 'Cannot add harvest to a closed cycle' })
  @ApiResponse({ status: 404, description: 'Production cycle not found' })
  create(@Body() createHarvestDto: CreateHarvestDto) {
    return this.harvestsService.create(createHarvestDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all harvests (optionally filter by cycle)' })
  @ApiQuery({ name: 'cycleId', required: false, type: Number, description: 'Filtrar cosechas por ID de ciclo productivo' })
  @ApiResponse({ status: 200, description: 'List of harvests retrieved' })
  findAll(@Query('cycleId') cycleId?: string) {
    if (cycleId) {
      return this.harvestsService.findAllByCycle(+cycleId);
    }
    return this.harvestsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a harvest by ID' })
  @ApiResponse({ status: 200, description: 'Harvest found' })
  @ApiResponse({ status: 404, description: 'Harvest not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.harvestsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'gerente', 'operador')
  @ApiOperation({ summary: 'Update a harvest' })
  @ApiResponse({ status: 200, description: 'Harvest updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot modify harvest in a closed cycle' })
  @ApiResponse({ status: 404, description: 'Harvest not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHarvestDto: UpdateHarvestDto,
  ) {
    return this.harvestsService.update(id, updateHarvestDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a harvest' })
  @ApiResponse({ status: 200, description: 'Harvest deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete harvest from a closed cycle' })
  @ApiResponse({ status: 404, description: 'Harvest not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.harvestsService.remove(id);
  }
}
