import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { List } from 'immutable';

import { Message } from './message';
import { Level } from './level';

@Injectable()
export class FlashMessageService {
  private messagesSubject: BehaviorSubject<List<Message>> = new BehaviorSubject(
    List<Message>([])
  );

  constructor() {}

  public get messages(): Observable<List<Message>> {
    return this.messagesSubject.asObservable();
  }

  public add(value: string, level: Level = Level.Primary) {
    this.messagesSubject.next(
      this.messagesSubject.value.push({ value, level })
    );
  }

  public remove(idx: number) {
    this.messagesSubject.next(this.messagesSubject.value.delete(idx));
  }
}
