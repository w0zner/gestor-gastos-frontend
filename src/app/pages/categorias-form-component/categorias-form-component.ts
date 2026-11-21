import { Component, computed, effect, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GenericService } from '../../services/generic-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

@Component({
  selector: 'app-categorias-form-component',
  imports: [ReactiveFormsModule],
  templateUrl: './categorias-form-component.html',
  styleUrl: './categorias-form-component.css',
})
export class CategoriasFormComponent {
  private fb = inject(FormBuilder);
  private genericService = inject(GenericService);
  isOpen = input.required<boolean>();
  item = input<any | null>(null);

  dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');


  close = output<void>();
  save = output<{ id?: string; payload: Omit<any, 'id'> }>();

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    color: [''],
  });

  private formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { initialValue: this.form.status }
  );

  canSubmit = computed(() => this.formStatus() === 'VALID');

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    console.log('Listo para enviar a Firestore:', raw);
    const current = this.item();

    this.save.emit({
      id: current?.id,
      payload: raw as Omit<any, 'id'>,
    });
  }

  onClose() {
    this.close.emit();
  }

  constructor() {
    effect(() => {
      const el = this.dialog()?.nativeElement;
      console.log("Dialog: ", el);
      console.log("Open: ", this.isOpen());

      if (!el) return;
      this.isOpen() ? el.showModal() : el.close();

      const current = this.item();
      const open = this.isOpen();

      if (!open) return;

      if (current) {
        this.form.patchValue({
          nombre: current.nombre,
          color: current.color
        });
      } else {
        this.form.reset({
          nombre: '',
          color: ''
        });
      }
    })
  }
}
