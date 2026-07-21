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

@ApiTags('Crop Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production-cycles/:cycleId/events')
export class CropEventsController {
  constructor(private readonly cropEventsService: CropEventsService) {}

  @Post()
  @Roles('admin', 'agronomo', 'operador', 'capataz')
  @ApiOperation({ summary: 'Register a new event in the production cycle' })
  @ApiResponse({ status: 201, description: 'Event registered successfully.' })
  @ApiResponse({ status: 400, description: 'Cycle is closed or invalid data.' })
  @ApiResponse({ status: 404, description: 'Cycle not found.' })
  create(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Body() createCropEventDto: CreateCropEventDto,
  ) {
    return this.cropEventsService.create(cycleId, createCropEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all events of a production cycle' })
  @ApiResponse({ status: 200, description: 'List of events retrieved.' })
  @ApiResponse({ status: 404, description: 'Cycle not found.' })
  findAll(@Param('cycleId', ParseIntPipe) cycleId: number) {
    return this.cropEventsService.findAll(cycleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific event by ID' })
  @ApiResponse({ status: 200, description: 'Event found.' })
  @ApiResponse({ status: 404, description: 'Event or cycle not found.' })
  findOne(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cropEventsService.findOne(cycleId, id);
  }

  @Patch(':id')
  @Roles('admin', 'agronomo')
  @ApiOperation({ summary: 'Update a registered event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully.' })
  @ApiResponse({ status: 400, description: 'Cycle is closed or invalid data.' })
  @ApiResponse({ status: 404, description: 'Event or cycle not found.' })
  update(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCropEventDto: UpdateCropEventDto,
  ) {
    return this.cropEventsService.update(cycleId, id, updateCropEventDto);
  }

  @Delete(':id')
  @Roles('admin', 'agronomo')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Cycle is closed.' })
  @ApiResponse({ status: 404, description: 'Event or cycle not found.' })
  remove(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cropEventsService.remove(cycleId, id);
  }
}
