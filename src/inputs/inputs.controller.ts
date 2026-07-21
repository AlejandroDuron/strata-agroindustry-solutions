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
  @ApiOperation({ summary: 'Register a new input for a production cycle' })
  @ApiResponse({ status: 201, description: 'Input created successfully.' })
  @ApiResponse({ status: 400, description: 'Production cycle is closed or invalid data.' })
  @ApiResponse({ status: 404, description: 'Production cycle not found.' })
  create(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Body() createInputDto: CreateInputDto,
  ) {
    return this.inputsService.create(cycleId, createInputDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all inputs for a production cycle' })
  @ApiResponse({ status: 200, description: 'List of inputs retrieved.' })
  @ApiResponse({ status: 404, description: 'Production cycle not found.' })
  findAll(@Param('cycleId', ParseIntPipe) cycleId: number) {
    return this.inputsService.findAll(cycleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific input' })
  @ApiResponse({ status: 200, description: 'Input found.' })
  @ApiResponse({ status: 404, description: 'Input or cycle not found.' })
  findOne(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inputsService.findOne(cycleId, id);
  }

  @Patch(':id')
  @Roles('admin', 'agronomo')
  @ApiOperation({ summary: 'Update an input (recalculates cycle cost)' })
  @ApiResponse({ status: 200, description: 'Input updated and cost recalculated.' })
  @ApiResponse({ status: 400, description: 'Production cycle is closed or invalid data.' })
  @ApiResponse({ status: 404, description: 'Input or cycle not found.' })
  update(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInputDto: UpdateInputDto,
  ) {
    return this.inputsService.update(cycleId, id, updateInputDto);
  }

  @Delete(':id')
  @Roles('admin', 'agronomo')
  @ApiOperation({ summary: 'Delete an input from a production cycle (recalculates cycle cost)' })
  @ApiResponse({ status: 200, description: 'Input deleted and cost recalculated.' })
  @ApiResponse({ status: 400, description: 'Production cycle is closed.' })
  @ApiResponse({ status: 404, description: 'Input or cycle not found.' })
  remove(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inputsService.remove(cycleId, id);
  }
}
