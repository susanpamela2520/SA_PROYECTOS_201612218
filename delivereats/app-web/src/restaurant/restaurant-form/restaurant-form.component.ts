import { Component, Inject, inject } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Restaurant } from '../intefaces/restaurant.interface';

@Component({
  selector: 'app-restaurant-form',
  imports: [SharedModule],
  templateUrl: './restaurant-form.component.html',
  styleUrl: './restaurant-form.component.scss',
  standalone: true,
})
export class RestaurantFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RestaurantFormComponent>);

  form!: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: Restaurant | null) {
    this.form = this.fb.group({
      name: [data?.name || '', [Validators.required]],
      category: [data?.category || '', [Validators.required]],
      address: [data?.address || '', [Validators.required]],
      horario: [data?.horario || '', [Validators.required]],
      calificacion: [''],
    });
  }

  onSave() {
    console.log(this.form.value);
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
