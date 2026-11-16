import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PagosService } from '../../services/pagos-service';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

@Component({
  selector: 'app-plantillas-form-component',
  imports: [ReactiveFormsModule],
  templateUrl: './plantillas-form-component.html',
  styleUrl: './plantillas-form-component.css',
})
export class PlantillasFormComponent {
    private fb = inject(FormBuilder);
    private pagosService = inject(PagosService);
  private router = inject(Router);
  mesActual = new Date().getMonth() + 1;
  anoActual = new Date().getFullYear();

  form = this.fb.group({
    concepto: ['', [Validators.required, Validators.minLength(2)]],
    dia_vencimiento: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    anho: [this.anoActual, [Validators.required, Validators.min(2000), Validators.max(2100)]],
    mes: [this.mesActual, [Validators.required, Validators.min(1), Validators.max(12)]],
    notas: [''],
    estado: ['', [Validators.required]],
    activo: [true, [Validators.required]],
    monto_estimado: [0],
    categoria: ['', [Validators.required]],
    esFijo: [true, [Validators.required]]
  });

  categorias = toSignal(this.pagosService.getCategorias(), { initialValue: [] });
  estados = toSignal(this.pagosService.getEstados(), { initialValue: [] });

/*   private formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() }
  ); */

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

    const payload = this.form.getRawValue();
    console.log('Listo para enviar a Firestore:', payload);
  }
}
