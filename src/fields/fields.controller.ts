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
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Fields')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
@ApiForbiddenResponse({ description: 'The user role does not have permission for this operation' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) { }

  @Post()
  @Roles('admin', 'gerente')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a field in a farm' })
  @ApiResponse({ status: 201, description: 'Field created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Farm not found or deleted' })
  create(@Body() createFieldDto: CreateFieldDto) {
    return this.fieldsService.create(createFieldDto);
  }

  @Get()
  @ApiOperation({ summary: 'List active fields of a farm' })
  @ApiQuery({ name: 'farmId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'List of active fields' })
  findAll(@Query('farmId', ParseIntPipe) farmId: number) {
    return this.fieldsService.findAllByFarm(farmId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get field by ID (includes deleted)' })
  @ApiResponse({ status: 200, description: 'Field details' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fieldsService.findOneOrThrow(id);
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Update field data' })
  @ApiResponse({ status: 200, description: 'Field updated' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  @ApiResponse({ status: 409, description: 'Open cycles prevent area change' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFieldDto: UpdateFieldDto,
  ) {
    return this.fieldsService.update(id, updateFieldDto);
  }

  @Delete(':id')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Deactivate field (soft delete)' })
  @ApiResponse({ status: 200, description: 'Field deactivated' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fieldsService.remove(id);
  }
}
