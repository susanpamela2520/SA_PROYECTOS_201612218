import { Component, inject, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-auth',
  imports: [SharedModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
  standalone: true,
})
export class AuthComponent implements OnInit {
  formBuilder = inject(FormBuilder);
  form!: FormGroup;
  router = inject(Router);
  hide = signal(true);
  authService = inject(AuthService);
  errorMessage: string = '';

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    this.form = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  login() {
    if (this.form.invalid) {
      this.reset();
      return;
    }

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        if (res.token) {
          console.log('Login exitoso:', res);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Credenciales incorrectas';
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error de conexión con el servidor';
      },
    });
  }

  reset() {
    this.form.reset();
  }

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  get usernameValue() {
    return this.form.get('username');
  }

  get passwordValue() {
    return this.form.get('password');
  }
}
