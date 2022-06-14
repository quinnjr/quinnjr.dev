declare let process: any;

import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { StorageMap } from '@ngx-pwa/local-storage';
import { FlashMessageService } from '../flash-message/flash-message.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public loginForm: UntypedFormGroup = this.$fb.group({
    email: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(
    private $storage: StorageMap,
    private $httpClient: HttpClient,
    private $fb: UntypedFormBuilder,
    private $router: Router,
    private $flashMessageService: FlashMessageService
  ) {}

  public ngOnInit(): void {}

  public submit(): void {
    this.$httpClient.post('/api/auth/login', this.loginForm.value).subscribe(
      (res: any) => {
        this.$storage.set('access_token', res.access_token).subscribe();
        this.$router.navigate(['/admin']);
      },
      (err) => this.$flashMessageService.add(err)
    );
  }
}
