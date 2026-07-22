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
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CropsService } from './crops.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Crops')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
@ApiForbiddenResponse({ description: 'The user role does not have permission for this operation' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crops')
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Post()
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Create a new crop' })
  @ApiResponse({ status: 201, description: 'Crop created successfully' })
  @ApiResponse({ status: 409, description: 'A crop with the same type and variety already exists' })
  create(@Body() createCropDto: CreateCropDto) {
    return this.cropsService.create(createCropDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all crops' })
  @ApiResponse({ status: 200, description: 'List of crops' })
  findAll() {
    return this.cropsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a crop by ID' })
  @ApiResponse({ status: 200, description: 'Crop found' })
  @ApiResponse({ status: 404, description: 'Crop not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cropsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Update a crop' })
  @ApiResponse({ status: 200, description: 'Crop updated successfully' })
  @ApiResponse({ status: 404, description: 'Crop not found' })
  @ApiResponse({ status: 409, description: 'A crop with the same type and variety already exists' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCropDto: UpdateCropDto,
  ) {
    return this.cropsService.update(id, updateCropDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a crop (soft delete by default, hard delete with ?hard=true)' })
  @ApiQuery({ name: 'hard', required: false, type: String, description: 'Set to "true" for permanent deletion' })
  @ApiResponse({ status: 200, description: 'Crop deleted successfully' })
  @ApiResponse({ status: 404, description: 'Crop not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Query('hard') hard?: string) {
    return this.cropsService.remove(id, hard === 'true');
  }
}
