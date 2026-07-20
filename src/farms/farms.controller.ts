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

@ApiTags('Farms')
@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
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
  @ApiOperation({ summary: 'Deactivate farm (soft delete)' })
  @ApiResponse({ status: 200, description: 'Farm deactivated' })
  @ApiResponse({ status: 404, description: 'Farm not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.farmsService.remove(id);
  }
}
