import { Component, Inject, inject } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MenuItem } from '../intefaces/menu.interface';

@Component({
  selector: 'app-menu-form',
  imports: [SharedModule],
  templateUrl: './menu-form.component.html',
  styleUrl: './menu-form.component.scss',
  standalone: true,
})
export class MenuFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<MenuFormComponent>);
  form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { item: MenuItem | null }) {
    this.form = this.fb.group({
      name: [data.item?.name || '', [Validators.required]],
      description: [data.item?.description || '', [Validators.required]],
      price: [data.item?.price || '', [Validators.required, Validators.min(0)]],
    });
  }

  onSave() {
    if (this.form.valid) this.dialogRef.close(this.form.value);
  }
  onCancel() {
    this.dialogRef.close();
  }
}
