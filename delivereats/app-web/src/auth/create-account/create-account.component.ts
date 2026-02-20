import { Component, inject, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Rol } from '../../core/constant';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-create-account',
  imports: [SharedModule, RouterLink],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss',
  standalone: true,
})
export class CreateAccountComponent implements OnInit {
  formBuilder = inject(FormBuilder);
  form!: FormGroup;
  router = inject(Router);
  hide = signal(true);
  authService = inject(AuthService);
  rolOptions = Rol;
  errorMessage: string = '';
  successMessage: string = '';

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    this.form = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', Validators.required],
      role: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  createAccount() {
    if (this.form.invalid) {
      this.reset();
      return;
    }

    this.authService.register(this.form.value).subscribe({
      next: (res) => {
        if (res.userId) {
          this.successMessage = 'Cuenta creada con éxito. Redirigiendo...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = Array.isArray(res.error)
            ? res.error[0]
            : 'Error al registrar';
        }
      },
      error: (err) => {
        console.log(err);
        this.errorMessage = 'Error en el servidor o correo ya registrado.';
      },
    });
  }

  reset() {
    this.form.reset();
  }

  showPassword(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  get firstNameValue() {
    return this.form.get('firstName');
  }

  get lastNameValue() {
    return this.form.get('lastName');
  }

  get emailValue() {
    return this.form.get('email');
  }

  get rolValue() {
    return this.form.get('role');
  }

  get passwordValue() {
    return this.form.get('password');
  }
}
