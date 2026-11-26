import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { PagosService } from '../../services/pagos-service';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlantillasFormComponent } from '../plantillas-form-component/plantillas-form-component';
import { PlantillasService } from '../../services/plantillas-service';
import { SidebarService } from '../../services/sidebar-service';
import { Pago } from '../../interfaces/pago';
import { TypeResponse } from '../../interfaces/operation-response';
import { ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-plantillas-list-component',
  templateUrl: './plantillas-list-component.html',
  styleUrl: './plantillas-list-component.css',
  imports: [DatePipe, ReactiveFormsModule, CurrencyPipe, PlantillasFormComponent]
})
export class PlantillasListComponent {
  private pagosService = inject(PagosService);
  private plantillasService = inject(PlantillasService);
  private auth = inject(Auth);
  sidebarService = inject(SidebarService);
  toastService = inject(ToastService);

  private readonly coleccion_local = 'plantillas';
  private readonly coleccion_foranea = 'gastos';

  usuario = toSignal(user(this.auth), { initialValue: null });

  isModalOpen = signal(false);
  selectedExpense = signal<Pago | null>(null);

  listaPagos = signal<Pago[]>([]);

  plantillasRaw = toSignal(this.plantillasService.obtenerPlantillas(true), { initialValue: [] });
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
    if (event.id) {
      //console.log('Guardando cambios en el pago con ID:', event.id, 'con datos:', event.payload);
      const response = await this.pagosService.updateDoc(event.id, event.payload, 'plantillas');
      this.toastService.showFromResponse(response);
    } else {
      //console.log('Creando nuevo pago con datos:', event.payload);
      const response = await this.pagosService.createDoc(event.payload, 'plantillas');
      this.toastService.showFromResponse(response);
    }
    this.closeModal();
  }

  copiar(pago: Pago) {
    const mesActual = new Date().getMonth() + 1;
    const anhoActual = new Date().getFullYear();
    const templateId = pago.id;
    this.pagosService.copiarPlantilla(this.coleccion_local, this.coleccion_local, templateId!, mesActual, anhoActual)
      .then((response) => {
        this.toastService.showFromResponse(response)
      })
      .catch((error) => {
        console.error('Error al copiar la plantilla:', error);
        this.toastService.error('Error al copiar la plantilla:' + error)
      });
  }

  copiarToPagos(pago: Pago) {
    console.log('Copiando registro de pago...');
    const mesActual = new Date().getMonth() + 1;
    const anhoActual = new Date().getFullYear();
    const templateId = pago.id;
    this.pagosService.copiarPlantilla(this.coleccion_local, this.coleccion_foranea, templateId!, mesActual, anhoActual)
      .then(() => {
        console.log('Plantilla copiada con éxito');
      })
      .catch((error) => {
        console.error('Error al copiar la plantilla:', error);
      });
  }

  async cambiarActivo(pago: Pago, event: Event) {
    const input = event.target as HTMLInputElement;
    const nuevoActivo = input.checked;

    if (!pago.id) return;

    try {
      const response = await this.plantillasService.actualizarActivo(pago.id, nuevoActivo);
      if (response.type !== TypeResponse.OK) {
        input.checked = !nuevoActivo;
      }
      this.toastService.showFromResponse(response);
    } catch (error) {
      input.checked = !nuevoActivo;
      console.error('Error al actualizar el estado activo:', error);
      this.toastService.error('Error al actualizar el estado activo: ' + error);
    }
  }

  eliminarPlantilla(pago: Pago) {
    this.pagosService.deleteDoc(this.coleccion_local, pago.id)
      .then((response) => {
        this.toastService.showFromResponse(response);
      })
      .catch((error) => {
        this.toastService.error('Error al eliminar la plantilla ' + error);
        console.error('Error al eliminar la plantilla:', error);
      });
  }
}
