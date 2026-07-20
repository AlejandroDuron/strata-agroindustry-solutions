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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';

@ApiTags('Lotes')
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un lote en una finca' })
  @ApiResponse({ status: 201, description: 'Lote creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Finca no encontrada o eliminada' })
  create(@Body() createFieldDto: CreateFieldDto) {
    return this.fieldsService.create(createFieldDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar lotes activos de una finca' })
  @ApiQuery({ name: 'farmId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Lista de lotes activos' })
  findAll(@Query('farmId', ParseIntPipe) farmId: number) {
    return this.fieldsService.findAllByFarm(farmId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar lote por ID (incluye eliminados)' })
  @ApiResponse({ status: 200, description: 'Detalle del lote' })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fieldsService.findOneOrThrow(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un lote' })
  @ApiResponse({ status: 200, description: 'Lote actualizado' })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  @ApiResponse({ status: 409, description: 'Ciclos abiertos impiden cambio de área' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFieldDto: UpdateFieldDto,
  ) {
    return this.fieldsService.update(id, updateFieldDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar lote' })
  @ApiResponse({ status: 200, description: 'Lote desactivado' })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fieldsService.remove(id);
  }
}
