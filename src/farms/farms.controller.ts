import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';

@ApiTags('Fincas')
@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una nueva finca' })
  @ApiResponse({ status: 201, description: 'Finca creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Nombre duplicado' })
  create(@Body() createFarmDto: CreateFarmDto) {
    return this.farmsService.create(createFarmDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar fincas activas' })
  @ApiResponse({ status: 200, description: 'Lista de fincas activas' })
  findAll() {
    return this.farmsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar finca por ID (incluye eliminadas)' })
  @ApiResponse({ status: 200, description: 'Detalle de la finca' })
  @ApiResponse({ status: 404, description: 'Finca no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.farmsService.findOneOrThrow(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de una finca' })
  @ApiResponse({ status: 200, description: 'Finca actualizada' })
  @ApiResponse({ status: 404, description: 'Finca no encontrada' })
  @ApiResponse({ status: 409, description: 'Nombre duplicado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFarmDto: UpdateFarmDto,
  ) {
    return this.farmsService.update(id, updateFarmDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar finca (soft delete)' })
  @ApiResponse({ status: 200, description: 'Finca desactivada' })
  @ApiResponse({ status: 404, description: 'Finca no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.farmsService.remove(id);
  }
}
