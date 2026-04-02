import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Public()
  @Get('trending')
  async getTrending(@Query('page') page?: string) {
    const parsedPage = Number(page ?? 1);
    return this.moviesService.getTrendingMovies(Number.isNaN(parsedPage) ? 1 : parsedPage);
  }

  @Public()
  @Get('search')
  async search(
    @Query('q') query?: string,
    @Query('page') page?: string,
  ) {
    if (!query?.trim()) {
      return [];
    }

    const parsedPage = Number(page ?? 1);
    return this.moviesService.searchMovies(
      query,
      Number.isNaN(parsedPage) ? 1 : parsedPage,
    );
  }
}
