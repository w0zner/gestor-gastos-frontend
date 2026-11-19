import { Component, computed, effect, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PagosService } from '../../services/pagos-service';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

interface Pago {
  id?: string;
  anho: number;
  mes: number;
  concepto: string;
  monto_estimado: number;
  monto_pagado: number;
  dia_vencimiento: number;
  fecha_pago: any;
  notas?: string | null;
  estado: string;
  categoria: string;
  esFijo: boolean;
  templateId?: string;
  activo: boolean;
  fecha_creacion: string;
}

@Component({
  selector: 'app-plantillas-form-component',
  imports: [ReactiveFormsModule],
  templateUrl: './plantillas-form-component.html',
  styleUrl: './plantillas-form-component.css',
})
export class PlantillasFormComponent {
    private fb = inject(FormBuilder);
    private pagosService = inject(PagosService);
    isOpen = input.required<boolean>();
    item = input<any | null>(null);

    dialog= viewChild<ElementRef<HTMLDialogElement>>('dialog');


    close = output<void>();
    save = output<{ id?: string; payload: Omit<Pago, 'id'> }>();

    mesActual = new Date().getMonth() + 1;
    anoActual = new Date().getFullYear();

    categorias = toSignal(this.pagosService.getCategorias(), { initialValue: [] });
    estados = toSignal(this.pagosService.getEstados(), { initialValue: [] });

    categoriaDefault = computed(() => {
      const cat = this.categorias();
      console.log("Cat ", cat);
      console.log("Cat default ", cat.length ? cat[0].id : '');
      return cat.length ? cat[0].id : '';
    });

    estadoDefault = computed(() => {
      const estados = this.estados();
      const defaultEstado = estados.find(e => e.nombre === 'Sin empezar');
      return defaultEstado ? defaultEstado.id : '';
    })


  form = this.fb.group({
    concepto: ['', [Validators.required, Validators.minLength(2)]],
    dia_vencimiento: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    anho: [this.anoActual, [Validators.required, Validators.min(2000), Validators.max(2100)]],
    mes: [this.mesActual, [Validators.required, Validators.min(1), Validators.max(12)]],
    notas: [''],
    estado: [this.estadoDefault(), [Validators.required]],
    activo: [true, [Validators.required]],
    monto_estimado: [0],
    categoria: [this.categoriaDefault(), [Validators.required]],
    esFijo: [true, [Validators.required]]
  });



/*   private formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() }
  ); */

  private formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { initialValue: this.form.status }
  );

  canSubmit = computed(() => this.formStatus() === 'VALID');

  obtenerCategoriaId(nombre: string): string {
    const categoria = this.categorias().find(c => c.nombre === nombre);
    return categoria ? categoria.id : '';
  }

  obtenerEstadoId(nombre: string): string {
    const estado = this.estados().find(e => e.nombre === nombre);
    return estado ? estado.id : '';
  }

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
      payload: raw as Omit<Pago, 'id'>,
    });
  }

  onClose() {
    this.close.emit();
  }

  constructor() {
    effect(() => {
      console.log("Categorias ", this.categorias());
      const el = this.dialog()?.nativeElement;
      console.log("Dialog: ", el);
      console.log("Open: ", this.isOpen());

      if(!el) return;
      this.isOpen() ? el.showModal() : el.close();

      const current = this.item();
      const open = this.isOpen();

      if (!open) return;

      if (current) {
        console.log('Editando plantilla existente:', current);
        this.form.patchValue({
          concepto: current.concepto,
          dia_vencimiento: current.dia_vencimiento,
          anho: current.anho,
          mes: current.mes,
          notas: current.notas,
          estado: this.obtenerEstadoId(current.nombreEstado),
          activo: current.activo,
          monto_estimado: current.monto_estimado,
          categoria: this.obtenerCategoriaId(current.nombreCategoria),
          esFijo: current.esFijo
        });
      } else {
        this.form.reset({
          concepto: '',
          dia_vencimiento: 1,
          anho: this.anoActual,
          mes: this.mesActual,
          notas: '',
          estado: this.estadoDefault(),
          activo: true,
          monto_estimado: 0,
          categoria: this.categoriaDefault(),
          esFijo: true
        });
      }
    })
  }
}
