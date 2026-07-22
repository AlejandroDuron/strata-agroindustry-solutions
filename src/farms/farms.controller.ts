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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Farms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  @Roles('admin', 'gerente')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new farm' })
  @ApiResponse({ status: 201, description: 'Farm created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Duplicate name' })
  create(@Body() createFarmDto: CreateFarmDto) {
    return this.farmsService.create(createFarmDto);
  }

  @Get()
  @ApiOperation({ summary: 'List active farms' })
  @ApiResponse({ status: 200, description: 'List of active farms' })
  findAll() {
    return this.farmsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get farm by ID (includes deleted)' })
  @ApiResponse({ status: 200, description: 'Farm details' })
  @ApiResponse({ status: 404, description: 'Farm not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.farmsService.findOneOrThrow(id);
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Update farm data' })
  @ApiResponse({ status: 200, description: 'Farm updated' })
  @ApiResponse({ status: 404, description: 'Farm not found' })
  @ApiResponse({ status: 409, description: 'Duplicate name' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFarmDto: UpdateFarmDto,
  ) {
    return this.farmsService.update(id, updateFarmDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate farm (soft delete)' })
  @ApiResponse({ status: 200, description: 'Farm deactivated' })
  @ApiResponse({ status: 404, description: 'Farm not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.farmsService.remove(id);
  }
}
