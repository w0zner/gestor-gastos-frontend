import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { PagosService } from '../../services/pagos-service';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlantillasFormComponent } from '../plantillas-form-component/plantillas-form-component';


interface Pago {
  id?: string;
  anho: number;
  mes: number;
  concepto: string;
  monto_estimado: number;
  monto_pagado: number;
  dia_vencimiento: number;
  fecha_pago: any;
  notas: string;
  estado: string;
  categoria: string;
  esFijo: boolean;
  templateId?: string;
  fecha_creacion: string;
  activo: boolean;
}

@Component({
  selector: 'app-plantillas-list-component',
  templateUrl: './plantillas-list-component.html',
  styleUrl: './plantillas-list-component.css',
  imports: [DatePipe, ReactiveFormsModule, CurrencyPipe, RouterLink, PlantillasFormComponent]
})
export class PlantillasListComponent {
  private pagosService = inject(PagosService);
  private auth = inject(Auth);

  usuario = toSignal(user(this.auth), { initialValue: null });

  isModalOpen = signal(false);
  selectedExpense = signal<Pago | null>(null);

  listaPagos = signal<Pago[]>([]);

  plantillasRaw = toSignal(this.pagosService.getPlantillas(true), { initialValue: [] });
  categorias = toSignal(this.pagosService.getCategorias(), { initialValue: [] });
  estados = toSignal(this.pagosService.getEstados(), { initialValue: [] });

  constructor() {
    effect(() => {
      console.log('Modal estado:', this.isModalOpen());
      console.log(this.selectedExpense());
    });
  }

  pagos = computed(() => {
    const listaPlantillas = this.plantillasRaw();
    const listaCategorias = this.categorias();
    const listaEstados = this.estados();

    if (!listaPlantillas.length) return [];

    return listaPlantillas.map((item: any) => {
      const estadoId = item.estado?.id;
      const categoriaId = item.categoria?.id;
      const catMatch = listaCategorias.find(c => c.id === categoriaId);
      const estMatch = listaEstados.find(e => e.id === estadoId);

      const rawFecha = item.fecha_creacion;
      let fechaNormalizada: Date | null = null;

      if (rawFecha) {
        if (typeof rawFecha.toDate === 'function') {
          fechaNormalizada = rawFecha.toDate();
        } else if (rawFecha.seconds) {
          fechaNormalizada = new Date(rawFecha.seconds * 1000);
        } else {
          fechaNormalizada = new Date(rawFecha);
        }
      }

      return {
        ...item,
        fecha_creacion: fechaNormalizada,
        nombreCategoria: catMatch ? catMatch.nombre : 'Sin categoría',
        colorCategoria: catMatch ? catMatch.color : '#000000',

        nombreEstado: estMatch ? estMatch.nombre : 'Sin estado',
        colorEstado: estMatch ? estMatch.color : '#000000'
      };
    });
  });


  openCreateModal() {
    this.selectedExpense.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(expense: Pago) {
    this.selectedExpense.set(expense);
    this.isModalOpen.set(true);
  }

  closeModal() {
    console.log('Cerrando modal...');
    this.isModalOpen.set(false);
    this.selectedExpense.set(null);
  }

  async manejoGuardado(event: { id?: string; payload: Omit<Pago, 'id'> }) {
    if(event.id) {
      console.log('Guardando cambios en el pago con ID:', event.id, 'con datos:', event.payload);
      await this.pagosService.updateDoc(event.id, event.payload, 'plantillas');
    } else {
      console.log('Creando nuevo pago con datos:', event.payload);
      await this.pagosService.createDoc(event.payload, 'plantillas');
    }
    this.closeModal();
  }

  copiar(pago: Pago) {
    console.log('Copiando plantilla...');
    const mesActual = new Date().getMonth() + 1;
    const anhoActual = new Date().getFullYear();
    const templateId = pago.id;
    this.pagosService.copiarPlantilla('plantillas', 'plantillas', templateId!, mesActual.toString(), anhoActual.toString())
      .then(() => {
        console.log('Plantilla copiada con éxito');
      })
      .catch((error) => {
        console.error('Error al copiar la plantilla:', error);
      });
  }

  eliminarPlantilla(pago: Pago) {
    console.log('Eliminando plantilla con ID:', pago.id);
    if (!pago.id) {
      console.error('No se puede eliminar la plantilla: ID no definido.');
      return;
    }

    this.pagosService.deleteTemplate('plantillas', pago.id)
      .then(() => {
        console.log(`Plantilla con ID ${pago.id} eliminada con éxito.`);
      })
      .catch((error) => {
        console.error('Error al eliminar la plantilla:', error);
      });
  }
}
