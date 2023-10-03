import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { DatabaseService } from '../database/database.service';

import { Public } from '../auth/public.decorator';

import { Project } from '../../graphql/project/project.model';

@Resolver((of: any) => Project)
export class ProjectsResolver {
  constructor(private readonly $databaseService: DatabaseService) {}

  @Public()
  @Query((returns) => [Project], { name: 'projects' })
  public async getProjects(
    @Args('userId', { nullable: true }) userId?: string,
    @Args('take', { type: () => Int, nullable: true }) take?: number
  ): Promise<Project[] | null> {
    // return this.$databaseService.project.findMany({
    //   where: {
    //     userId
    //   },
    //   take
    // });
    return null;
  }
}
