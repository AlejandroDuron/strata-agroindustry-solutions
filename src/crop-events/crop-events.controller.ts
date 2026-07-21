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
import { CropEventsService } from './crop-events.service';
import { CreateCropEventDto } from './dto/create-crop-event.dto';
import { UpdateCropEventDto } from './dto/update-crop-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('crop-events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production-cycles/:cycleId/events')
export class CropEventsController {
  constructor(private readonly cropEventsService: CropEventsService) {}

  @Post()
  @Roles('admin', 'agronomo', 'operador', 'capataz')
  @ApiOperation({ summary: 'Registrar un nuevo evento en el ciclo productivo' })
  @ApiResponse({ status: 201, description: 'Evento registrado correctamente.' })
  @ApiResponse({ status: 400, description: 'Ciclo cerrado o datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Ciclo no encontrado.' })
  create(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Body() createCropEventDto: CreateCropEventDto,
  ) {
    return this.cropEventsService.create(cycleId, createCropEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los eventos de un ciclo productivo' })
  @ApiResponse({ status: 200, description: 'Listado de eventos obtenido.' })
  @ApiResponse({ status: 404, description: 'Ciclo no encontrado.' })
  findAll(@Param('cycleId', ParseIntPipe) cycleId: number) {
    return this.cropEventsService.findAll(cycleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un evento específico por ID' })
  @ApiResponse({ status: 200, description: 'Evento encontrado.' })
  @ApiResponse({ status: 404, description: 'Evento o ciclo no encontrado.' })
  findOne(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cropEventsService.findOne(cycleId, id);
  }

  @Patch(':id')
  @Roles('admin', 'agronomo')
  @ApiOperation({ summary: 'Actualizar un evento registrado' })
  @ApiResponse({ status: 200, description: 'Evento actualizado correctamente.' })
  @ApiResponse({ status: 400, description: 'Ciclo cerrado o datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Evento o ciclo no encontrado.' })
  update(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCropEventDto: UpdateCropEventDto,
  ) {
    return this.cropEventsService.update(cycleId, id, updateCropEventDto);
  }

  @Delete(':id')
  @Roles('admin', 'agronomo')
  @ApiOperation({ summary: 'Eliminar un evento' })
  @ApiResponse({ status: 200, description: 'Evento eliminado correctamente.' })
  @ApiResponse({ status: 400, description: 'Ciclo cerrado.' })
  @ApiResponse({ status: 404, description: 'Evento o ciclo no encontrado.' })
  remove(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cropEventsService.remove(cycleId, id);
  }
}
