declare const process: any;

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApolloQueryResult } from '@apollo/client/core';
import { Subscription, Observable } from 'rxjs';
import { Apollo, gql } from 'apollo-angular';

@Component({
  selector: 'app-resume',
  templateUrl: './resume.component.html',
  styleUrls: ['./resume.component.scss']
})
export class ResumeComponent {

  constructor() {}

}
