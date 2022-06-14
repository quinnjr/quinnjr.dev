/* eslint-disable prettier/prettier */
import { Inject, CACHE_MANAGER } from '@nestjs/common';
import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { default as axios } from 'axios'
import { Cache } from 'cache-manager';

import { Public } from '../auth/public.decorator';
import { GithubResponse } from './dto/github-response';

@Resolver((of: any) => GithubResponse)
export class GithubResolver {
  constructor(
    private readonly $configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly $cacheManager: Cache
  ) {}

  @Public()
  @Query((returns) => GithubResponse)
  public async getGithubInformation(
    @Args('limit', { type: () => Int, nullable: true}) limit: number = 10
  ): Promise<GithubResponse> {
    let response: any = await this.$cacheManager.get('githubResponse');

    if (!response) {
      const query = `
        query {
          viewer {
            url
            repositories(
              first: ${limit},
              orderBy: { field: UPDATED_AT, direction: DESC }
            ) {
              edges {
                node {
                  description
                  name
                  url
                }
              }
            }
          }
        }
      `;

      response  = await axios.post('https://api.github.com/graphql', {
        query,
      }, {
          headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `bearer ${this.$configService.get<string>('GH_TOKEN')}`
        }
      });

      this.$cacheManager.set('githubResponse', response);
    }

    const ghResponse = new GithubResponse(response.data.data);

    return ghResponse;
  }
}
