import { InjectionToken, NgModule } from '@angular/core';
import {
  BrowserModule,
  BrowserTransferStateModule,
  TransferState,
  makeStateKey
} from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { StorageModule, StorageMap } from '@ngx-pwa/local-storage';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FlashMessageComponent } from './flash-message/flash-message.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { NavigationComponent } from './navigation/navigation.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { AdminLoadGuard } from './admin-load.guard';
import { JwtInterceptor } from './jwt.interceptor';
import { HttpErrorInterceptor } from './http-error.interceptor';
import { FlashMessageService } from './flash-message/flash-message.service';

const APOLLO_CACHE = new InjectionToken<InMemoryCache>('apollo-cache');
const STATE_KEY = makeStateKey<any>('apollo.state');

@NgModule({
  imports: [
    BrowserModule.withServerTransition({ appId: 'quinnjr.tech' }),
    BrowserTransferStateModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    // 3rd Party
    ApolloModule,
    StorageModule.forRoot({
      /* eslint @typescript-eslint/naming-convention: off */
      IDBDBName: 'quinnjrtech',
      LSPrefix: 'quinnjr_tech_'
    }),
    // Site imports
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    FlashMessageComponent,
    HomeComponent,
    LoginComponent,
    NavigationComponent,
    NotFoundComponent
  ],
  providers: [
    UserService,
    AuthService,
    FlashMessageService,
    AdminLoadGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
    {
      provide: APOLLO_CACHE,
      useValue: new InMemoryCache()
    },
    {
      provide: APOLLO_OPTIONS,
      useFactory: (
        httpLink: HttpLink,
        cache: InMemoryCache,
        transferState: TransferState,
        store: StorageMap
      ) => {
        const isBrowser = transferState.hasKey<any>(STATE_KEY);

        if (isBrowser) {
          const state = transferState.get<any>(STATE_KEY, null);
        } else {
          transferState.onSerialize(STATE_KEY, () => cache.extract());
        }

        const basic = setContext((operation, context) => ({
          headers: {
            Accept: 'charset=utf-8'
          }
        }));

        const auth = setContext((operation, context) => {
          const token = store.get('accessToken').subscribe(() => {});

          if (token === null) {
            return {};
          } else {
            return {
              headers: {
                Authorization: `Bearer ${token}`
              }
            };
          }
        });

        const link = ApolloLink.from([
          basic,
          auth,
          httpLink.create({
            uri: '/graphql'
          })
        ]);

        return { cache, link };
      },
      deps: [HttpLink, APOLLO_CACHE, TransferState, StorageMap]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
