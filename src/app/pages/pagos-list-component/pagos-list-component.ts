import { Component, computed, effect, inject, signal } from '@angular/core';
import { PagosService } from '../../services/pagos-service';
import { Auth, user } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { collection, Firestore } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { forkJoin } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

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
}

@Component({
  selector: 'app-pagos-list-component',
  templateUrl: './pagos-list-component.html',
  styleUrl: './pagos-list-component.css',
  imports: [DatePipe, CurrencyPipe]
})
export class PagosListComponent {
  private pagosService = inject(PagosService);
  private router = inject(Router);
  private auth = inject(Auth);

  usuario = toSignal(user(this.auth), { initialValue: null });

  categoriasMap: { [key: string]: any } = {};
  estadosMap: { [key: string]: any } = {};

  listaPagos = signal<Pago[]>([]);
  cantidadPagos = signal(0);

  pagosRaw = toSignal(this.pagosService.getPagosDelUsuario(11, 2026), { initialValue: [] });
  categorias = toSignal(this.pagosService.getCategorias(), { initialValue: [] });
  estados = toSignal(this.pagosService.getEstados(), { initialValue: [] });

  pagos = computed(() => {
    const listaPagos = this.pagosRaw();
    const listaCategorias = this.categorias();
    const listaEstados = this.estados();

    if(!listaPagos.length) return [];

    return listaPagos.map((item: any) => {
      const estadoId = item.estado?.id;
      const categoriaId = item.categoria?.id;
      const catMatch =  listaCategorias.find(c => c.id === categoriaId);
      const estMatch =  listaEstados.find(e => e.id === estadoId);

      return {
        ...item,
        nombreCategoria: catMatch ? catMatch.nombre : 'Sin categoría',
        colorCategoria: catMatch ? catMatch.color : '#000000',

        nombreEstado: estMatch ? estMatch.nombre : 'Sin estado',
        colorEstado: estMatch ? estMatch.color : '#000000'
      };
    });
  });


  constructor() {
    effect(() => {
      // Esto se disparará dos veces: primero con [] y luego con los datos reales cuando lleguen de Firebase
      console.log('Datos actuales de la señal pagos():', this.pagosRaw());
      console.log('Datos actuales de la señal categorias():', this.categorias());
      console.log('Datos actuales de la señal estados():', this.estados());

      //effect(() => {
        console.log('Usuario actual:', this.usuario()?.uid);
      //});
    });
  }

  async cambiarEstado(pagoId: string, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const nuevoEstadoId = selectElement.value;
    console.log(selectElement);
    console.log(`Cambiando estado del pago ${pagoId} al nuevo estado ${nuevoEstadoId}`);

    try {
      await this.pagosService.actualizarEstadoPago(pagoId, nuevoEstadoId);
      console.log('Estado actualizado con éxito en Firestore');
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
    }
  }

  copiar() {
    console.log('Copiando plantilla...');
    const templateId = 'nJVmNkzUxaaLcvJK3ppW';
    const targetMonth = '2026-12'; // Formato YYYY-MM
    this.pagosService.copiarPlantilla(templateId, targetMonth)
      .then(() => {
        console.log('Plantilla copiada con éxito');
      })
      .catch((error) => {
        console.error('Error al copiar la plantilla:', error);
      });
  }


}
