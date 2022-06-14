import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { List } from 'immutable';

import { FlashMessageService } from './flash-message.service';
import { Level } from './level';
import { Message } from './message';

@Component({
  selector: 'app-flash-message',
  templateUrl: './flash-message.component.html',
  styleUrls: ['./flash-message.component.scss']
})
export class FlashMessageComponent {
  constructor(private readonly $flashMessageService: FlashMessageService) {}

  public get messages(): Observable<List<Message>> {
    return this.$flashMessageService.messages;
  }

  public close(idx: number) {
    this.$flashMessageService.remove(idx);
  }
}
