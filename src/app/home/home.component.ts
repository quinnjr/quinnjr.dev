import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Subscription } from 'rxjs';

import { FlashMessageService } from '../flash-message/flash-message.service';
import { Level } from '../flash-message/level';
import { Article } from '@prisma/client';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public articles = [] as Article[];
  public githubResponse: BehaviorSubject<any | null> = new BehaviorSubject(
    null
  );

  private querySubscription?: Subscription;

  constructor(
    private readonly $apollo: Apollo,
    private readonly $flashMessage: FlashMessageService,
    @Inject(PLATFORM_ID) private $platformId: any
  ) {}

  public ngOnInit(): void {
    if (isPlatformBrowser(this.$platformId)) {
      const query = gql`
        {
          getGithubInformation(limit: 10) {
            repositories {
              name
              description
              url
            }
          }
        }
      `;

      this.querySubscription = this.$apollo
        .watchQuery<any>({
          query
        })
        .valueChanges.subscribe(({ data, error, loading }) => {
          if (loading) {
            // do stuff
          }

          if (error) {
            this.$flashMessage.add(error.message, Level.Danger);
          } else {
            this.githubResponse.next(data.getGithubInformation.repositories);
          }
        });
    }
  }

  public ngOnDestroy() {
    this.querySubscription?.unsubscribe();
  }
}
