import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InputsService } from './inputs.service';
import { CreateInputDto } from './dto/create-input.dto';
import { UpdateInputDto } from './dto/update-input.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('inputs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production-cycles/:cycleId/inputs')
export class InputsController {
  constructor(private readonly inputsService: InputsService) {}

  @Post()
  @Roles('admin', 'agronomo', 'operador', 'capataz')
  @ApiOperation({ summary: 'Registrar un nuevo insumo para un ciclo productivo' })
  @ApiResponse({ status: 201, description: 'Insumo creado correctamente.' })
  @ApiResponse({ status: 400, description: 'Ciclo productivo cerrado o datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Ciclo productivo no encontrado.' })
  create(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Body() createInputDto: CreateInputDto,
  ) {
    return this.inputsService.create(cycleId, createInputDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los insumos asociados a un ciclo productivo' })
  @ApiResponse({ status: 200, description: 'Listado de insumos obtenido.' })
  @ApiResponse({ status: 404, description: 'Ciclo productivo no encontrado.' })
  findAll(@Param('cycleId', ParseIntPipe) cycleId: number) {
    return this.inputsService.findAll(cycleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de un insumo específico' })
  @ApiResponse({ status: 200, description: 'Insumo encontrado.' })
  @ApiResponse({ status: 404, description: 'Insumo o ciclo no encontrado.' })
  findOne(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inputsService.findOne(cycleId, id);
  }

  @Patch(':id')
  @Roles('admin', 'agronomo')
  @ApiOperation({ summary: 'Actualizar la información de un insumo (recalcula el costo del ciclo)' })
  @ApiResponse({ status: 200, description: 'Insumo actualizado y costo recalculado.' })
  @ApiResponse({ status: 400, description: 'Ciclo productivo cerrado o datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Insumo o ciclo no encontrado.' })
  update(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInputDto: UpdateInputDto,
  ) {
    return this.inputsService.update(cycleId, id, updateInputDto);
  }

  @Delete(':id')
  @Roles('admin', 'agronomo')
  @ApiOperation({ summary: 'Eliminar un insumo de un ciclo productivo (recalcula el costo del ciclo)' })
  @ApiResponse({ status: 200, description: 'Insumo eliminado y costo recalculado.' })
  @ApiResponse({ status: 400, description: 'Ciclo productivo cerrado.' })
  @ApiResponse({ status: 404, description: 'Insumo o ciclo no encontrado.' })
  remove(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inputsService.remove(cycleId, id);
  }
}
