import { Injectable, ServiceUnavailableException } from '@nestjs/common';

interface TmdbResult {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

@Injectable()
export class MoviesService {
  private readonly tmdbBaseUrl: string;
  private readonly tmdbImageBaseUrl: string;
  private readonly tmdbApiKey?: string;
  private readonly tmdbAccessToken?: string;

  constructor() {
    this.tmdbBaseUrl =
      process.env.TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';
    this.tmdbImageBaseUrl =
      process.env.TMDB_IMAGE_BASE_URL ?? 'https://image.tmdb.org/t/p/w500';
    this.tmdbApiKey = process.env.TMDB_API_KEY?.trim();
    this.tmdbAccessToken = process.env.TMDB_ACCESS_TOKEN?.trim();
  }

  async getTrendingMovies(page = 1) {
    const data = await this.callTmdb(`/trending/movie/week?language=id-ID&page=${page}`);
    return this.mapResults(data.results ?? []);
  }

  async searchMovies(query: string, page = 1) {
    const keyword = encodeURIComponent(query.trim());
    const data = await this.callTmdb(
      `/search/movie?language=id-ID&query=${keyword}&include_adult=false&page=${page}`,
    );

    return this.mapResults(data.results ?? []);
  }

  private async callTmdb(path: string): Promise<{ results?: TmdbResult[] }> {
    if (!this.tmdbApiKey && !this.tmdbAccessToken) {
      throw new ServiceUnavailableException(
        'Konfigurasi TMDB belum lengkap (TMDB_API_KEY atau TMDB_ACCESS_TOKEN)',
      );
    }

    const separator = path.includes('?') ? '&' : '?';
    const url = this.tmdbAccessToken
      ? `${this.tmdbBaseUrl}${path}`
      : `${this.tmdbBaseUrl}${path}${separator}api_key=${this.tmdbApiKey}`;

    const response = await fetch(url, {
      headers: {
        ...(this.tmdbAccessToken
          ? { Authorization: `Bearer ${this.tmdbAccessToken}` }
          : {}),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const details = await response.text();
      throw new ServiceUnavailableException(
        `Gagal mengambil data film dari TMDB (${response.status}): ${details}`,
      );
    }

    return response.json() as Promise<{ results?: TmdbResult[] }>;
  }

  private mapResults(results: TmdbResult[]) {
    return results.map((movie) => ({
      tmdbId: movie.id,
      title: movie.title ?? movie.name ?? 'Untitled',
      overview: movie.overview ?? '',
      posterUrl: movie.poster_path
        ? `${this.tmdbImageBaseUrl}${movie.poster_path}`
        : null,
      backdropUrl: movie.backdrop_path
        ? `${this.tmdbImageBaseUrl}${movie.backdrop_path}`
        : null,
      releaseDate: movie.release_date ?? movie.first_air_date ?? null,
      rating: movie.vote_average ?? 0,
    }));
  }
}
