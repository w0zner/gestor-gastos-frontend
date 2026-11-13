import { Component, computed, inject, signal } from '@angular/core';
import { PagosService } from '../../services/pagos-service';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';

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
  selector: 'app-plantillas-list-component',
  imports: [],
  templateUrl: './plantillas-list-component.html',
  styleUrl: './plantillas-list-component.css',
})
export class PlantillasListComponent {
  private pagosService = inject(PagosService);
  private router = inject(Router);
  private auth = inject(Auth);

  usuario = toSignal(user(this.auth), { initialValue: null });

  categoriasMap: { [key: string]: any } = {};
  estadosMap: { [key: string]: any } = {};

  listaPagos = signal<Pago[]>([]);

  plantillasRaw = toSignal(this.pagosService.getPlantillas(true), { initialValue: [] });
  categorias = toSignal(this.pagosService.getCategorias(), { initialValue: [] });
  estados = toSignal(this.pagosService.getEstados(), { initialValue: [] });

  pagos = computed(() => {
    const listaPagos = this.plantillasRaw();
    const listaCategorias = this.categorias();
    const listaEstados = this.estados();

    if (!listaPagos.length) return [];

    return listaPagos.map((item: any) => {
      const estadoId = item.estado?.id;
      const categoriaId = item.categoria?.id;
      const catMatch = listaCategorias.find(c => c.id === categoriaId);
      const estMatch = listaEstados.find(e => e.id === estadoId);

      return {
        ...item,
        nombreCategoria: catMatch ? catMatch.nombre : 'Sin categoría',
        colorCategoria: catMatch ? catMatch.color : '#000000',

        nombreEstado: estMatch ? estMatch.nombre : 'Sin estado',
        colorEstado: estMatch ? estMatch.color : '#000000'
      };
    });
  });

  copiar() {
    console.log('Copiando plantilla...');
    const templateId = 'nJVmNkzUxaaLcvJK3ppW';
    const targetMonth = '2026-12'; // Formato YYYY-MM
    this.pagosService.copiarDocumento(templateId, targetMonth)
      .then(() => {
        console.log('Plantilla copiada con éxito');
      })
      .catch((error) => {
        console.error('Error al copiar la plantilla:', error);
      });
  }
}
